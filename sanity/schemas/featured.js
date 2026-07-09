export default {
  name: 'featured',
  title: 'Featured Category Rows',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Featured Row Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'restaurants',
      title: 'Restaurants in this Row',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'restaurant' }] }],
    },
  ],
};
