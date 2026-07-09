import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, update, set, push } from 'firebase/database';
import { database } from '../../firebase';
import { AuthContext } from '../context/AuthContext';

export default function WalletScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  
  // Wallet States
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deposit Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const userId = user?.uid || 'guest_user';

  // 1. Subscribe to Firebase real-time wallet data
  useEffect(() => {
    const walletRef = ref(database, `users/${userId}/wallet`);
    const unsubscribe = onValue(walletRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBalance(data.balance || 0.00);
        if (data.transactions) {
          const list = Object.keys(data.transactions).map(key => ({
            id: key,
            ...data.transactions[key]
          }));
          list.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(list);
        } else {
          setTransactions([]);
        }
      } else {
        // Mock default if node doesn't exist yet
        setBalance(0.00);
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDeposit = async () => {
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    setDepositing(true);

    try {
      const walletRef = ref(database, `users/${userId}/wallet`);
      const newBalance = balance + amountNum;
      
      // Update balance
      await update(walletRef, { balance: newBalance });

      // Add transaction history record
      const transRef = ref(database, `users/${userId}/wallet/transactions`);
      await push(transRef, {
        amount: amountNum,
        type: 'deposit',
        description: 'Deposited funds via personal card',
        date: new Date().toISOString()
      });

      setModalVisible(false);
      setDepositAmount('');
      Alert.alert("Deposit Success", `$${amountNum.toFixed(2)} has been successfully added to your wallet!`);
    } catch (e) {
      Alert.alert("Deposit Failed", e.message);
    } finally {
      setDepositing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chow Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          
          {/* Card Wallet Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
            
            <TouchableOpacity 
              style={styles.depositBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={18} color="#06C167" style={{ marginRight: 6 }} />
              <Text style={styles.depositBtnText}>Deposit Funds</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Ledger Title */}
          <Text style={styles.sectionTitle}>Transaction History</Text>

          <View style={{ gap: 12, marginTop: 12 }}>
            {transactions.length > 0 ? (
              transactions.map((t) => {
                const isDeposit = t.type === 'deposit';
                return (
                  <View key={t.id} style={styles.transRow}>
                    <View style={[styles.iconCircle, { backgroundColor: isDeposit ? '#E6FAF0' : '#FFEBEE' }]}>
                      <Ionicons 
                        name={isDeposit ? 'arrow-down-circle' : 'arrow-up-circle'} 
                        size={22} 
                        color={isDeposit ? '#06C167' : '#D32F2F'} 
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.transDesc}>{t.description}</Text>
                      <Text style={styles.transDate}>
                        {new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <Text style={[styles.transAmount, { color: isDeposit ? '#06C167' : '#D32F2F' }]}>
                      {isDeposit ? '+' : '-'}${t.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="swap-vertical-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No transaction records</Text>
                <Text style={styles.emptySubText}>Deposits or payment checkouts using your wallet will appear here.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}

      {/* Deposit Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Enter the amount to deposit from your saved card.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.input}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0.00"
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>

            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={handleDeposit}
              disabled={depositing}
            >
              {depositing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#06C167',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#E6FAF0',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 18,
  },
  depositBtnText: {
    color: '#06C167',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transDate: {
    fontSize: 11,
    color: '#888888',
    marginTop: 3,
  },
  transAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12.5,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalSub: {
    fontSize: 13.5,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#06C167',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dollarSign: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  confirmBtn: {
    backgroundColor: '#06C167',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
