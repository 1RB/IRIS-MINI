import {
  Collection,
  CommandInteraction,
  Guild,
  GuildMember,
  Message,
  Role,
  Snowflake,
  UserResolvable,
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  version,
} from "discord.js";
import { AppInterface } from "./interfaces/appInterface.js";
import { IRISGlobal } from "./interfaces/global.js";
import prettyMilliseconds from "pretty-ms";
import chalk from "chalk";
import { EventEmitter } from "events";
import JsonCParser from "jsonc-parser";
import { readFileSync, readdirSync } from "fs";
import dotenv from "dotenv";
import moment from "moment";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname)

dotenv.config();
declare const global: IRISGlobal;
//! -- This is the start of the IRIS journey -- !\\
(async () => {
  const config = JsonCParser.parse(
    readFileSync("./config.jsonc", { encoding: "utf-8" })
  );
  
  const app: AppInterface = {
    version: JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }))
      .version,
    config: config,
    debugLog: config.debugging ? console.log : () => {},
  };
  global.app = app;
  global.bannedUsers = [];
  global.birthdays = [];
  global.communicationChannel = new EventEmitter();
  global.newMembers = [];
  global.dirName = __dirname;
  global.app.config.development = process.env.DEVELOPMENT == "YES";
  global.mongoConnectionString =
    "mongodb://iris:" +
    process.env.DBPASSWD +
    "@extension.inimicalpart.com:27017/?authMechanism=DEFAULT&tls=true";
  const mainFileName = __filename.split(
    process.platform == "linux" ? "/" : "\\"
  )[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
  if (global.app.config.development) {
    global.app.config.mainServer = global.app.config.developmentServer;
  }
  try {
    if (process.env.TOKEN == null) {
      console.log(
        "Token is missing, please make sure you have the .env file in the directory with the correct information. Please see https://github.com/InimicalPart/IRIS for more information."
      );
      process.exit(1);
    }

    const client = new Client({
      intents: [
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
      ],
    });

    //!--------------------------
    console.clear();
    console.log(
      chalk.white.bold(
        "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [" +
          __filename.split(process.platform == "linux" ? "/" : "\\")[
            __filename.split(process.platform == "linux" ? "/" : "\\").length -
              1
          ] +
          "] "
      ) +
        chalk.green("IRIS ") +
        chalk.bold.white("v" + app.version) +
        chalk.green(" is starting up!") 
    );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );

    //!--------------------------
    const requiredModules: { [key: string]: any } = {};
    console.log(
      chalk.white.bold(
        "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [" +
          __filename.split(process.platform == "linux" ? "/" : "\\")[
            __filename.split(process.platform == "linux" ? "/" : "\\").length -
              1
          ] +
          "] "
      ) +
        chalk.white("[I] ") +
        chalk.yellow("Logging in... ") +
        chalk.white("[I]")
    );
    client.on(Events.MessageCreate, async (message: Message) => {
      const prioritizedTable: { [key: string]: any } = {};
      for (let i of Object.keys(requiredModules)) {
        if (i.startsWith("event")) {
          const priority = requiredModules[i].priority() ?? 0;
          const priorityKey = Number(priority).toString();
          prioritizedTable[priorityKey] = prioritizedTable[priorityKey] ?? [];
          prioritizedTable[priorityKey].push(i);
        }
      }
      for (const prio of Object.keys(prioritizedTable).sort(
        (a: string, b: string) => parseInt(b) - parseInt(a)
      )) {
        for (let i of prioritizedTable[prio]) {
          if (requiredModules[i].eventType() === "onMessage") {
            requiredModules[i].runEvent(message, requiredModules);
          }
        }
      }
    });

    client.on(Events.InteractionCreate, async (interaction: any) => {
      if (interaction.guild == null)
        return await interaction.reply(
          ":x: This command can only be used in a server."
        );
      if (interaction.guildId !== global.app.config.mainServer) return;
      const client = new MongoClient(global.mongoConnectionString);
      try {
        const database = client.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
        // Query for a movie that has the title 'Back to the Future'
        const query = { id: interaction.user.id };
        let userInfo: any = await userdata.findOne(query);
        const user = await interaction.guild.members.fetch(interaction.user.id);
        if (userInfo == null) {
          userInfo = {
            id: interaction.user.id,
            discriminator: interaction.user.discriminator,
            last_active: new Date().toISOString(),
            timezones: [],
            username: interaction.user.username,
            approximatedTimezone: null,
            birthday: null,
            birthdayPassed: false,
            isNew:
              new Date().getTime() - (user.joinedAt?.getTime() ?? 0) <
              7 * 24 * 60 * 60 * 1000,
          };
          await userdata.insertOne(userInfo);
        } else {
          const updateDoc = {
            $set: {
              last_active: new Date().toISOString(),
            },
          };
          await userdata.updateOne(query, updateDoc, {});
        }
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
      if (!interaction.isChatInputCommand()) return;
      for (let command in requiredModules) {
        if (command.startsWith("cmd")) {
          if (
            interaction.commandName == command.replace("cmd", "").toLowerCase()
          ) {
            requiredModules[command].runCommand(interaction, requiredModules);
          }
        }
      }
    });

    client.on(Events.ClientReady, async () => {
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          chalk.white("[I] ") +
          chalk.green("Logged in!") +
          chalk.white(" [I]")
      );
            console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );

      const commands: Array<string> = [];
      // Grab all the command files from the commands directory you created earlier
      const commandsPath = join(__dirname, "commands");
      const commandFiles = readdirSync(commandsPath).filter((file: string) =>
        file.endsWith(".cmd.js")
      );

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of commandFiles) {
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Registering command: " +chalk.blueBright(file));
        const command = await import(`./commands/${file}`);
        requiredModules[
          "cmd" +
            command.getSlashCommand().name[0].toUpperCase() +
            command.getSlashCommand().name.slice(1)
        ] = command;
        commands.push(command?.getSlashCommand()?.toJSON());
      }
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );

      const eventsPath = join(__dirname, "events");
      const eventFiles = readdirSync(eventsPath).filter((file: string) =>
        file.endsWith(".evt.js")
      );
      // const eventFiles = []

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of eventFiles) {
        const event = await import(`./events/${file}`);
        requiredModules[
          "event" +
            file.replace(".evt.js", "")[0].toUpperCase() +
            file.replace(".evt.js", "").slice(1)
        ] = event;
      }
      const rest = new REST({
        version: "9",
      }).setToken(process.env.TOKEN);
      (async () => {
        try {
          await rest.put(
            Routes.applicationGuildCommands(
              client.user.id,
              global.app.config.mainServer
            ),
            {
              body: commands,
            }
          );
        } catch (error) {
          console.error(error);
        }
      })();
      if (!global.app.config.development)
        client.user.setPresence({
          activities: [
            {
              name: "you",
              type: ActivityType.Watching,
            },
          ],
          status: "online",
        });
      const mainServer = await client.guilds.fetch(
        global.app.config.mainServer
      );
      let users: Array<UserResolvable> = [];
      await mainServer.members
        .fetch()
        .then(async (member: Collection<Snowflake, GuildMember>) =>
          member.forEach(async (m: GuildMember) => users.push(m.id))
        )
        .catch(console.error);

      const clienttwo = new MongoClient(global.mongoConnectionString);
      try {
        const database = clienttwo.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
        const documents = await userdata.find().toArray();
        for (let document of documents) {
          let obj = {
            id: document.id,
            birthday: document.birthday,
            timezone: document.approximatedTimezone,
            passed: document.birthdayPassed,
          };
          if (document.birthday !== null) global.birthdays.push(obj);
          if (document.isNew) {
            if (!global.newMembers.includes(document.id))
              global.newMembers.push(document.id);
          }
        }
      } finally {
        await clienttwo.close();
      }
      const guild: Guild = await client.guilds.fetch(
        global.app.config.mainServer
      );
      await guild.roles
        .fetch()
        .then((roles: Collection<Snowflake, Role>): void => {
          roles.forEach((role: Role) => {
            if (role.name.toLowerCase().includes("new member")) {
              role.members.forEach((member: GuildMember) => {
                if (!global.newMembers.includes(member.id))
                  global.newMembers.push(member.id);
              });
              return;
            }
          });
        });

      const prioritizedTable: { [key: string]: any } = {};
      for (let i of Object.keys(requiredModules)) {
        if (i.startsWith("event")) {
          const priority: number = requiredModules[i].priority() ?? 0;
          const priorityKey: string = Number(priority).toString();
          prioritizedTable[priorityKey] = prioritizedTable[priorityKey] ?? [];
          prioritizedTable[priorityKey].push(i);
        }
      }

      for (const prio of Object.keys(prioritizedTable).sort(
        (a: string, b: string) => parseInt(b) - parseInt(a)
      )) {
        for (let i of prioritizedTable[prio]) {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Registering '"+chalk.yellow(requiredModules[i].eventType())+("discordEvent"===requiredModules[i].eventType()?" ("+chalk.blue.bold(requiredModules[i].getListenerKey())+")":"")+("runEvery"===requiredModules[i].eventType()?" ("+chalk.yellow(prettyMilliseconds(requiredModules[i].getMS(),{verbose:!0}))+")":"")+"' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
          if (requiredModules[i].eventType() === "runEvery") {
            if (requiredModules[i].runImmediately()) {
              /* prettier-ignore */
              global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.blue.bold("runImmediately")+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
              await requiredModules[i].runEvent(client, requiredModules);
            }
            setInterval(async () => {
              if (!requiredModules[i].running) {
                /* prettier-ignore */
                global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.yellow(prettyMilliseconds(requiredModules[i].getMS(),{verbose: true}))+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
                await requiredModules[i].runEvent(client, requiredModules);
              } else {
                /* prettier-ignore */
                global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Not running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.yellow(prettyMilliseconds(requiredModules[i].getMS(),{verbose: true}))+")' event: "+chalk.blueBright(requiredModules[i].returnFileName())+" reason: Previous iteration is still running.");
              }
            }, requiredModules[i].getMS());
          } else if (requiredModules[i].eventType() === "discordEvent") {
            client.on(
              requiredModules[i].getListenerKey(),
              async (...args: any) => {
                /* prettier-ignore */
                global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+__filename.split(process.platform == "linux" ? "/" :"\\")[__filename.split(process.platform == "linux" ? "/" :"\\").length - 1]+"] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.blue.bold(requiredModules[i].getListenerKey())+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
                await requiredModules[i].runEvent(requiredModules, ...args);
              }
            );
          } else if (requiredModules[i].eventType() === "onStart") {
            global.app.debugLog(
              chalk.white.bold(
                "[" +
                  moment().format("M/D/y HH:mm:ss") +
                  "] [" +
                  __filename.split(process.platform == "linux" ? "/" : "\\")[
                    __filename.split(process.platform == "linux" ? "/" : "\\")
                      .length - 1
                  ] +
                  "] "
              ) +
                "Running '" +
                chalk.yellow(requiredModules[i].eventType()) +
                "' event: " +
                chalk.blueBright(requiredModules[i].returnFileName())
            );
            await requiredModules[i].runEvent(client, requiredModules);
          }
        }
      }
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          "All commands and events have been registered. " +
          eventFiles.length +
          " event(s), " +
          commands.length +
          " command(s)."
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          chalk.redBright(mainServer.name) +
          " has " +
          chalk.cyanBright(users.length) +
          " members."
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          "Current date & time is: " +
          chalk.cyanBright(
            DateFormatter.formatDate(
              new Date(),
              `MMMM ????, YYYY @ hh:mm:ss A`
            ).replace("????", getOrdinalNum(new Date().getDate()))
          )
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          "Discord.JS version: " +
          chalk.yellow(version)
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          "Current API Latency: " +
          chalk.cyanBright(client.ws.ping) +
          " ms"
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) +
          chalk.blue.bold(client.user.tag) +
          " is ready and is running " +
          chalk.blue.bold(
            global.app.config.development ? "DEVELOPMENT" : "COMMUNITY"
          ) +
          " edition!"
      );
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [" + mainFileName + "] "
        ) + "------------------------"
      );
    });

    /* prettier-ignore */
    const getOrdinalNum = (n:number)=> { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
    /* prettier-ignore */
    const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e:any, t:any) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t:any) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t:any) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e:any, t:any, r:any) { return e.replace(t, (function (e:any) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e:any) { return (e + 24) % 12 || 12 }, getAmPm: function (e:any) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e:any, t:any, r:any, g:any) { return e.replace(t, (function (e:any) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

    client.login(process.env.TOKEN);
  } catch (e: any) {
    console.log(
      chalk.hex("#FF0000").bold("-----------------------------------[") +
        chalk.white.bold(e.toString().replace(/:.*/g, "")) +
        chalk.hex("#FF0000").bold("]-----------------------------------\n")
    );
    console.log(e);
    console.log(
      chalk.hex("#FF0000").bold("\n-----------------------------------[") +
        chalk.white.bold(e.toString().replace(/:.*/g, "")) +
        chalk.hex("#FF0000").bold("]-----------------------------------")
    );
  }
})();