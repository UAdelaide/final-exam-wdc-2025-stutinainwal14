const { createApp } = Vue;

    createApp({
      data() {
        return {
          dogImage: ''
        };
      },
      mounted() {
        this.getDog();
      },
      methods: {
        async getDog() {
          try {
            const res = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await res.json();
            this.dogImage = data.message;
          } catch (err) {
            console.error("Error fetching dog image:", err);
          }
        }
      }
    }).mount('#app');