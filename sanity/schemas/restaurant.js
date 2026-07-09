export default {
  name: 'restaurant',
  title: 'Restaurant',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Restaurant Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'string',
      validation: (Rule) => Rule.max(200),
    },
    {
      name: 'image',
      title: 'Restaurant Image',
      type: 'image',
    },
    {
      name: 'lat',
      title: 'Latitude of the Restaurant',
      type: 'number',
    },
    {
      name: 'lng',
      title: 'Longitude of the Restaurant',
      type: 'number',
    },
    {
      name: 'address',
      title: 'Restaurant Address',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Enter a Rating (1-5 Stars)',
      type: 'number',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(5)
          .error('Please enter a value between 1 and 5'),
    },
    {
      name: 'reviews',
      title: 'Reviews Count',
      type: 'string',
      placeholder: 'e.g., 140 reviews'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'dishes',
      title: 'Dishes / Menu Items',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'dish' }] }],
    },
  ],
};
