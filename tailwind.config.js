/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {  
    extend: { 
      fontFamily:{
       cinzel: ['Cinzel','serif'],
      },
      screens:{
        'max-390' : {'max':'390px'},
      }
    }
  },
  plugins: [],
}

