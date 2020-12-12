// Loading Requirements
const discord = require("discord.js");
const config = require("./data/config.json");
const activeSongs = new Map();
const enmap = require("enmap");

//  Command handler
const fs = require("fs");
const { isFunction } = require("util");
const client = new discord.Client();
client.commands = new discord.Collection();

// Bot Start
client.login(config.token);

const settings = new enmap({
  name: "settings",
  autoFetch: true,
  cloneLevel: "deep",
  fetchAll: true
});

//  Command handler
fs.readdir("./commands/", (err, files) => {

    if (err) console.log(err);

    var jsFiles = files.filter(f => f.split(".").pop() === "js");

    if (jsFiles.length <= 0) {
        console.log("Kon geen files vinden");
        return;
    }

    jsFiles.forEach((f, i) => {

        var fileGet = require(`./commands/${f}`);
        console.log(`De file ${f} is geladen`);

        client.commands.set(fileGet.help.name, fileGet);
    });

});

// Ready event!
client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  client.user.setActivity(`Serving ${client.users.cache.size} users!`);
});

// Guild Create Event!
client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.users.cache.size} users!`);

  
const JoinEmbed = new discord.MessageEmbed()
  .setTitle("Thanks for adding me! :partying_face:")
  .setDescription("**-** Type **/help** for a list of commands!\n**-** My prefix is **/**!\n**-** Found a bug? DM GwnStijn#7866!\n\n**-** Support discord\nhttps://discord.gg/gXZjrk3fua")


  guild.channels.cache.filter(c => c.type === 'text').find(p => p.position === 0).send(JoinEmbed);
});

// Guild Delete Event! 
client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.users.cache.size} users!`);
});

client.on("message", async message => {

    if (message.author.bot) return;

    if (message.channel.type === "dm") return;

    var prefix = config.prefix;

    var messageArray = message.content.split(" ");

    var command = messageArray[0];

    if (!message.content.startsWith(prefix)) return;

    var arguments = messageArray.slice(1);

    var commands = client.commands.get(command.slice(prefix.length));

    if (commands) commands.run(client, message, arguments);

    if (command === `${prefix}ticket-setup`) {
      if (!message.member.hasPermission("ADMINISTRATOR"))
        return message.reply(`You Do Not Have Enough Permission To Use This Command`);
      let channel = message.mentions.channels.first();
      if (!channel) return message.reply(`Usage: ${prefix}ticket-setup #channel-name`);
      const rle = message.guild.roles.cache.find(role => role.name === "Ticket-Support");
      if (!rle)
        return message.reply("I couldn't find a role called `Ticket-Support` Make sure you have a role called `Ticket-Support` with same capitalisation and give that role to all the mod/admin of your server"
        );
  
      let sent = await channel.send(
        new discord.MessageEmbed()
          .setTitle("Create a ticket")
          .setDescription("React to open a ticket!")
          .setFooter("SpaceBot | Coded by: GwnStijn#7866")
          .setColor("GREEN")
      );
  
      sent.react("🎫");
      settings.set(`${message.guild.id}-ticket`, sent.id);
  
      message.channel.send("Ticket setup done in");
    }
  
  if (command === `${prefix}close`) {
      if (!message.channel.name.includes("ticket-"))
        return message.channel.send("You cannot use that here!");
      let channel = message.channel
      channel.messages.fetch({limit:80})
      .then(function(messages) {
          let content = messages.map(message => message.content && message.content).join("\n");
          message.author.send(`Transcript for your ticket in ${message.guild.name} Server`);
          message.author.send({ files: [{ name: "ticket.txt", attachment: Buffer.from(content) }] });
        message.channel.send(`I have dmed you transcript if your dms are opened. Deleting channel in 20 seconds`)
        message.channel.send(`Just in case Your dms are closed here is transcript`)
        message.channel.send({ files: [{ name: "ticket.txt", attachment: Buffer.from(content) }] });  
  
  
        })
         setTimeout(function() {
          message.channel.delete();
                      }, 20000);
    }
  });
  
  client.on("messageReactionAdd", async (reaction, user, message) => {
    if (user.partial) await user.fetch();
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;
  
    let ticketid = await settings.get(`${reaction.message.guild.id}-ticket`);
  
    if (!ticketid) return;
  
    if (reaction.message.id == ticketid && reaction.emoji.name == "🎫") {
      reaction.users.remove(user);
  
      reaction.message.guild.channels
        .create(`ticket-${user.username}`, {
          permissionOverwrites: [
            {
              id: user.id,
              allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
            },
            {
              id: reaction.message.guild.roles.everyone,
              deny: ["VIEW_CHANNEL"]
            },
            {
              id: reaction.message.guild.roles.cache.find(
                role => role.name === "Ticket-Support"
              ),
              allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
            }
          ],
          type: "text"
        })
        .then(async channel => {
          channel.send(
            `<@${user.id}>`,
            new discord.MessageEmbed()
              .setTitle("Welcome to your ticket!")
              .setDescription("Support Team will be with you shortly")
              .setColor("RANDOM"));
        });
    }

});
