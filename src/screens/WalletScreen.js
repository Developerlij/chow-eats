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
  const [depositMethod, setDepositMethod] = useState('card'); // 'card' or 'bank'
  const [depositAmount, setDepositAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [verificationText, setVerificationText] = useState('');

  // Auto-generated dynamic payment reference for transfers
  const [transferRef, setTransferRef] = useState('');

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
        setBalance(0.00);
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Generate a random transfer reference code when modal opens
  useEffect(() => {
    if (modalVisible) {
      const refCode = 'CHOW-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setTransferRef(refCode);
    }
  }, [modalVisible]);

  // Card Deposit Handler
  const handleCardDeposit = async () => {
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    setDepositing(true);
    setVerificationText('Charging personal card...');

    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));

      const walletRef = ref(database, `users/${userId}/wallet`);
      const newBalance = balance + amountNum;
      
      await update(walletRef, { balance: newBalance });

      const transRef = ref(database, `users/${userId}/wallet/transactions`);
      await push(transRef, {
        amount: amountNum,
        type: 'deposit',
        description: 'Deposited funds via Card Checkout',
        date: new Date().toISOString()
      });

      setModalVisible(false);
      setDepositAmount('');
      Alert.alert("Deposit Success", `$${amountNum.toFixed(2)} has been added to your wallet!`);
    } catch (e) {
      Alert.alert("Deposit Failed", e.message);
    } finally {
      setDepositing(false);
      setVerificationText('');
    }
  };

  // Bank Transfer Settlement Simulator
  const handleBankDeposit = async () => {
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter the amount you transferred.");
      return;
    }
    if (!senderName) {
      Alert.alert("Sender Name Required", "Please input the bank account sender name to verify.");
      return;
    }

    setDepositing(true);
    
    // Step 1: Listening for network credit alert
    setVerificationText('Listening for credit notification alert...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 2: Querying Wema Bank settlement ledger
    setVerificationText(`Verifying settlement for ref: ${transferRef}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const walletRef = ref(database, `users/${userId}/wallet`);
      const newBalance = balance + amountNum;
      
      await update(walletRef, { balance: newBalance });

      const transRef = ref(database, `users/${userId}/wallet/transactions`);
      await push(transRef, {
        amount: amountNum,
        type: 'deposit',
        description: `Bank Transfer received from ${senderName.trim()} (${transferRef})`,
        date: new Date().toISOString()
      });

      setModalVisible(false);
      setDepositAmount('');
      setSenderName('');
      Alert.alert("Bank Transfer Confirmed", `Credit received! $${amountNum.toFixed(2)} added from ${senderName.toUpperCase()}.`);
    } catch (e) {
      Alert.alert("Settlement Error", e.message);
    } finally {
      setDepositing(false);
      setVerificationText('');
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
        onRequestClose={() => { if (!depositing) setModalVisible(false); }}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fund My Wallet</Text>
              {!depositing && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {depositing ? (
              /* PROGRESS LOADER SCREEN FOR TRANSFERS/CARDS */
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#06C167" style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' }}>Processing Transaction</Text>
                <Text style={{ fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' }}>{verificationText}</Text>
              </View>
            ) : (
              /* INTERACTIVE FORM PANEL */
              <View>
                {/* Method selector tabs */}
                <View style={styles.methodSelector}>
                  <TouchableOpacity 
                    style={[styles.methodTab, depositMethod === 'card' && styles.activeMethodTab]} 
                    onPress={() => setDepositMethod('card')}
                  >
                    <Ionicons name="card" size={16} color={depositMethod === 'card' ? '#06C167' : '#666'} />
                    <Text style={[styles.methodTabText, depositMethod === 'card' && styles.activeMethodTabText]}>Card Checkout</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.methodTab, depositMethod === 'bank' && styles.activeMethodTab]} 
                    onPress={() => setDepositMethod('bank')}
                  >
                    <Ionicons name="business" size={16} color={depositMethod === 'bank' ? '#06C167' : '#666'} />
                    <Text style={[styles.methodTabText, depositMethod === 'bank' && styles.activeMethodTabText]}>Bank Transfer</Text>
                  </TouchableOpacity>
                </View>

                {depositMethod === 'card' ? (
                  /* CARD DEPOSIT LAYOUT */
                  <View>
                    <Text style={styles.modalSub}>Enter the amount to deposit from your linked credit card.</Text>
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

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCardDeposit}>
                      <Text style={styles.confirmBtnText}>Confirm Card Payment</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* REAL-TIME BANK TRANSFER LAYOUT */
                  <View>
                    <View style={styles.bankDetailContainer}>
                      <Text style={styles.bankSubTitle}>CHOW CORPORATE BANK REFERENCE</Text>
                      
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Bank Name:</Text>
                        <Text style={styles.bankDetailVal}>Wema Bank</Text>
                      </View>
                      
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Account Number:</Text>
                        <Text style={styles.bankDetailVal} style={{ fontWeight: '800', color: '#06C167', fontSize: '15px' }}>0123456789</Text>
                      </View>

                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Account Name:</Text>
                        <Text style={styles.bankDetailVal}>ChowEats Delivery Ltd</Text>
                      </View>

                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Transfer Reference:</Text>
                        <Text style={styles.bankDetailVal} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{transferRef}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: '12px', color: '#666', marginBottom: '14px', fontStyle: 'italic', textAlign: 'center' }}>
                      Transfer funds using your banking app, input the reference code, then submit details below.
                    </Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Amount Sent ($)</Text>
                      <TextInput 
                        style={styles.simpleInput} 
                        value={depositAmount} 
                        onChangeText={setDepositAmount} 
                        placeholder="e.g. 50.00" 
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.formGroup} style={{ marginBottom: '20px' }}>
                      <Text style={styles.inputLabel}>Sender Account Name</Text>
                      <TextInput 
                        style={styles.simpleInput} 
                        value={senderName} 
                        onChangeText={setSenderName} 
                        placeholder="e.g. Lucas Bell" 
                      />
                    </View>

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleBankDeposit}>
                      <Text style={styles.confirmBtnText}>Confirm Bank Transfer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

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
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F3F3',
    padding: 4,
    borderRadius: 8,
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeMethodTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  activeMethodTabText: {
    color: '#06C167',
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
  bankDetailContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 16,
    gap: 8,
  },
  bankSubTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888888',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 13.5,
  },
  bankDetailLabel: {
    color: '#666666',
  },
  bankDetailVal: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
  },
  simpleInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FFF',
  }
});
