export default {
  name: 'dish',
  title: 'Dish',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name of Dish',
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
      name: 'price',
      title: 'Price of the Dish (USD)',
      type: 'number',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image of the Dish',
      type: 'image',
    },
  ],
};
