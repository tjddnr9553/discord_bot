const puppeteer = require('puppeteer');
const {EmbedBuilder, Client, GatewayIntentBits} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('키워드')
        .setDescription('궁금한 키워드를 입력해보세요!')
        .addStringOption(option =>
            option.setName("키워드")
                .setDescription("검색할 키워드")
                .setRequired(true)),
    async execute(interaction) {
        const keyword = interaction.options.getString("키워드");

        // Puppeteer를 이용하여 구글 검색
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent
        (keyword)}`);

        const results = await page.$$eval('.g', (elements) => {
            return elements.map(element => ({
                title: element?.querySelector('h3')?.textContent ?? '검색 결과 없음',
                link: element?.querySelector('a')?.href ?? '링크 없음'
            }));
        });

        // 추출된 정보를 바탕으로 Embed 생성
        const embed = new EmbedBuilder()
            .setTitle(`검색 결과: ${keyword}`)
            .setDescription('검색 중...');

        await interaction.deferReply({ embeds: [embed] });

        if (results.length === 0) {
            embed.setDescription('검색 결과가 없습니다.');
        } else {
            embed.setDescription(results.slice(0, 5).map(result => `* ${result.title} \n ${result.link}`).join('\n'));
        }

        await interaction.editReply({ embeds: [embed] });

        await browser.close();
    }
}

client.login(process.env.TOKEN);