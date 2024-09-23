const {ActionRowBuilder, ButtonBuilder, EmbedBuilder, Collection, Client, GatewayIntentBits} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('투표')
        .setDescription('정해진 시간동안 진행되는 투표!')
        .addStringOption(option =>
            option.setName("제한시간")
                .setDescription("투표 제한시간(분) 설정")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("투표주제")
                .setDescription("투표 주제 설정")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("옵션1")
                .setDescription("옵션1 설정")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("옵션2")
                .setDescription("옵션2 설정")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("옵션3")
                .setDescription("옵션3 설정")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("옵션4")
                .setDescription("옵션4 설정")
                .setRequired(false)),
    async execute(interaction) {
        const timeLimit = parseInt(interaction.options.getString('제한시간') || '0'); // 기본값 0 설정
        const endTime = new Date(Date.now() + timeLimit * 60000);
        const topic = interaction.options.getString("투표주제");

        const option1 = interaction.options.getString("옵션1");
        const option2 = interaction.options.getString("옵션2");
        const option3 = interaction.options.getString("옵션3");
        const option4 = interaction.options.getString("옵션4");

        const embed = new EmbedBuilder()
            .setTitle(topic)
            .setDescription("종료시간 : " + endTime.getHours() + "시 " + endTime.getMinutes() + "분 " + endTime.getSeconds() + "초까지")
            .setColor("Red");

        const options = [
            {id: 'option1', label: option1},
            {id: 'option2', label: option2},
            {id: 'option3', label: option3},
            {id: 'option4', label: option4},
        ].filter(option => option.label);

        let i = 3;

        const buttons = options.map(({id, label}) => {
            if (typeof id !== 'string') {
                console.error("Invalid id found in options:", id);
                return null;
            }

            return new ButtonBuilder()
                .setCustomId(id.toString())
                .setLabel(label)
                .setStyle(i++);
        })
            .filter(button => button);

        const row = new ActionRowBuilder().addComponents(...buttons);

        await interaction.reply({embeds: [embed], components: [row]});

        const guild = client.guilds.cache.get(interaction.guildId);
        const memberCount = guild.memberCount;
        if (guild) {
            console.log("Number of human members:", memberCount);
        } else {
            console.error("Guild not found.");
        }

        let votesStatus = 0; // 0 이면 투표 진행중, 1이면 투표 종료

        // 투표 수집
        const collector = interaction.channel.createMessageComponentCollector();
        const votes = new Collection(); // 투표 결과를 저장할 객체
        collector.on('collect', async i => {
            votesStatus = 0;
            if (votes.has(i.user.id)) {
                return;
            }

            votes.set(i.user.id, i.customId);
            await i.reply(i.user.globalName + ' 투표 완료');

            if (votes.size === memberCount - 1) {   // 4가 아닌 봇의 개수로 변경해야함
                console.log("투표 종료");
                votesStatus = 1;
                votesEnd();
            }
        });

        function votesEnd() {
            collector.stop();
            // console.log(buttons);

            // 투표 결과 집계
            const results = votes.reduce((acc, value) => {
                const optionData = options.find(opt => opt.id === value);
                acc[optionData.label] = (acc[optionData.label] || 0) + 1;
                return acc;
            }, {});

            // 투표 결과 발표
            const resultEmbed = new EmbedBuilder()
                .setTitle('투표 결과')
                .setColor('Blue');

            for (const [option, count] of Object.entries(results)) {
                resultEmbed.addFields({name: `최종 선택 : ${option}`, value: `투표 수: ${count}`});
            }

            // 버튼 비활성화 및 추가 텍스트
            const newRow = new ActionRowBuilder()
                .addComponents(
                    buttons.map(button =>
                        new ButtonBuilder()
                            .setCustomId(button.data.custom_id) // 명확하게 customId 사용
                            .setLabel(button.data.label)
                            .setStyle(button.data.style)
                            .setDisabled(true))
                );

            resultEmbed.setDescription('투표가 종료되었습니다.');

            interaction.editReply({embeds: [resultEmbed], components: [newRow]});
        }

        setTimeout(() => {
            if (votesStatus === 0) {
                votesEnd();
            }
        }, timeLimit * 60000);
    },
};

client.login(process.env.TOKEN);