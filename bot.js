require('dotenv').config();

const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const twitterClient = new TwitterApi(
  {
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
    bearerToken: process.env.BEARER_TOKEN,
  }
);

// Função para carregar o contador
function loadCounter() {
  try {
    const startedAt = new Date(process.env.STARTED_AT * 1000)
    const currentDate = new Date()
    const diffDays = parseInt((currentDate - startedAt) / (1000 * 60 * 60 * 24));
    return diffDays
  } catch (error) {
    return 1; // Se der erro, começa do dia 1
  }
}

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );

async function postCatPhoto() {
  try {
    const dayCount = loadCounter(); // Carrega o contador atual

    // Obtém uma imagem aleatória de gato
    const catResponse = await axios.get('https://api.thecatapi.com/v1/images/search');
    const catImageUrl = catResponse.data[0].url;

    await download_image(catImageUrl, 'gato.png')

    // Faz o upload da imagem para o Twitter
    const mediaId = await twitterClient.v1.uploadMedia("./gato.png");

    // Posta no Twitter com o contador de dias
    await twitterClient.readWrite.v2.tweet({
      text: `Dia #${dayCount}`,
      media: { media_ids: [mediaId] },
    });

    console.log(`Tweet do Dia ${dayCount} enviado com sucesso!`);

  } catch (error) {
    console.error('Erro ao postar no Twitter:', error);
  }
}

// Agendar para rodar todos os dias às 12h

setInterval(() => {
  const date = new Date();
  const minutes = date.getMinutes();
  const hours = date.getHours();
  if (minutes == 0 && hours == 12) {
    postCatPhoto();
  }
}, 60000)
