const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegPath);
const bot = new Telegraf(process.env.BOT_TOKEN);

// Validate YouTube URL
function isYoutubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
}

// Message handler
bot.on('message', async (ctx) => {
  const msg = ctx.message;
  if (!msg.text || !isYoutubeUrl(msg.text)) return;

  try {
    const info = await ytdl.getInfo(msg.text);
    const thumbnail = info.videoDetails.thumbnails[0].url;

    await ctx.replyWithPhoto(thumbnail, {
      caption: `Download "${info.videoDetails.title}"`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎵 Audio', callback_data: `audio:${info.videoDetails.videoId}` },
            { text: '🎥 Video', callback_data: `video:${info.videoDetails.videoId}` }
          ]
        ]
      }
    });
  } catch (error) {
    ctx.reply('❌ Error: Invalid YouTube URL');
  }
});

// Callback handler
bot.action(/^(audio|video):(.+)$/, async (ctx) => {
  const [type, videoId] = ctx.match.slice(1);
  const url = `https://youtu.be/${videoId}`;

  try {
    await ctx.deleteMessage(); // Delete button message
    const processingMsg = await ctx.reply('⏳ Processing...');

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const uniqueId = uuidv4();
    let filePath;

    if (type === 'audio') {
      filePath = path.join(tempDir, `${title}_${uniqueId}.mp3`);
      const audioStream = ytdl(url, { quality: 'highestaudio' });
      
      await new Promise((resolve, reject) => {
        ffmpeg(audioStream)
          .audioBitrate(128)
          .toFormat('mp3')
          .on('error', reject)
          .on('end', resolve)
          .save(filePath);
      });
    } else {
      filePath = path.join(tempDir, `${title}_${uniqueId}.mp4`);
      const videoStream = ytdl(url, { quality: 'highest' });
      
      await new Promise((resolve, reject) => {
        videoStream.pipe(fs.createWriteStream(filePath))
          .on('finish', resolve)
          .on('error', reject);
      });
    }

    await ctx.replyWithDocument({ source: filePath });
    await ctx.deleteMessage(processingMsg.message_id);
    fs.unlinkSync(filePath); // Cleanup
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Download failed!');
  }
});

// Start bot
bot.launch();
console.log('Bot started!');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));