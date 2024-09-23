require("dotenv").config();
const fs = require('fs');
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {Client, GatewayIntentBits, Collection} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));
const commands = [];

client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log("Ready!");

    const CLIENT_ID = client.user.id;
    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

    rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
    })
        .then(() =>
            console.log("Successfully registered application commands.")
        )
        .catch(console.error);
});


client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const cmd = msg.content;

    // if(msg.author.tag === "tae1843"){
    //     msg.reply("나 김태욱인데 남자 좋아한다.. 헤에..");
    // }

    // if(msg.author.tag === "jeonbyeongjun"){
    //     msg.reply("나 전병중인데 팀스파르타는 내가 간다.");
    // }

    // if(msg.author.tag === "tjddnr9553"){
    //     msg.reply("흐에!");
    // }

    // if(msg.author.tag === "ivlkyk"){
    //     msg.reply("알고리즘 안푸냐 태욱아");
    // }

    // if(msg.author.tag === "yuju_00"){
    //     msg.reply("칸예가 좋아.");
    // }
})

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});

client.login(process.env.TOKEN);