
// Telegram YouTube Downloader Bot using Node.js and telegraf.js
const { Telegraf, Markup } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');

const BOT_TOKEN = '7689202878:AAFmAuvelPlcnDm39acAJNfUcfsqJtSvN_U';
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('I am a YouTube Video and Audio downloader bot. S>

bot.on('text', async (ctx) => {
    const url = ctx.message.text;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
            const videoInfo = await axios.get(`https://noembed.com/embed?url=$>
            const title = videoInfo.data.title;
            const thumbnail = videoInfo.data.thumbnail_url;

            await ctx.replyWithPhoto(thumbnail, {
                caption: `*${title}* - Select a download option below.`,
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🎥 Video', `video_${url}`)],
                    [Markup.button.callback('🎧 Audio', `audio_${url}`)]
                ])
            });
        } catch (err) {
            ctx.reply('Please check the YouTube link and try again.');
        }
    } else {
        ctx.reply('Please provide a valid YouTube link.');
    }
});

bot.action(/(video|audio)_(.+)/, async (ctx) => {
    const [type, url] = ctx.match.slice(1);
    ctx.deleteMessage(); // Delete the button message
    const format = type === 'video' ? 'mp4' : 'mp3';
    const fileName = `download.${format}`;

    ctx.reply('Downloading... Please wait.');

    exec(`python3 -m yt_dlp -f bestaudio[ext=${format}]/best[ext=${format}] ${>
        if (err) return ctx.reply('Failed to download the file!');

        await ctx.replyWithDocument({ source: fileName });
        fs.unlinkSync(fileName); // Delete the file after sending
    });
});

bot.launch();
console.log('✅ Bot is running...');





