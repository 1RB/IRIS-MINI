/*
 * Copyright (c) 2024 Inimi | InimicalPart | Incoverse
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Discord, {
    ActivityType,
    CommandInteractionOptionResolver,
    GuildMemberRoleManager,
    Team,
    TextChannel,
  } from "discord.js";
  import { IRISGlobal } from "@src/interfaces/global.js";
  import { fileURLToPath } from "url";
  import chalk from "chalk";
  const __filename = fileURLToPath(import.meta.url);

const localReturnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];

global.logger.debug("Loading mod module '"+chalk.yellowBright("mod-ban")+"'...", localReturnFileName());
import * as ban from "./command-lib/mod/mod-ban.cmdlib.js";
global.logger.debug("Loading mod module '"+chalk.yellowBright("mod-unban")+"'...", localReturnFileName());
import * as unban from "./command-lib/mod/mod-unban.cmdlib.js";
global.logger.debug("Loading mod module '"+chalk.yellowBright("mod-kick")+"'...", localReturnFileName());
import * as kick from "./command-lib/mod/mod-kick.cmdlib.js";
global.logger.debug("Loading mod module '"+chalk.yellowBright("mod-mute")+"'...", localReturnFileName());
import * as mute from "./command-lib/mod/mod-mute.cmdlib.js";
global.logger.debug("Loading mod module '"+chalk.yellowBright("mod-unmute")+"'...", localReturnFileName());
import * as unmute from "./command-lib/mod/mod-unmute.cmdlib.js";

  const punishmentTypeMap= {
    "WARNING": "Warning",
    "TIMEOUT": "Timeout",
    "KICK": "Kick",
    "TEMPORARY_BANISHMENT": "Temporary ban",
    "PERMANENT_BANISHMENT": "Permanent ban"
  }



  declare const global: IRISGlobal;
  const commandInfo = {
      slashCommand: new Discord.SlashCommandBuilder()
      .setName("mod")
      .setDescription("mod Commands")
    .addSubcommand((subcommand) => //* ban <user> <reason> [remove] [duration] [delete messages (true/false)]
      subcommand
        .setName("ban")
        .setDescription("Ban a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to ban")
            .setRequired(true)
      )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the ban")
            .setRequired(true)
      )
        .addBooleanOption((option) =>
          option
            .setName("remove")
            .setDescription("Remove the ban on the user")
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("The duration of the ban")
      )
        .addBooleanOption((option) =>
          option
            .setName("delete-messages")
            .setDescription("Delete the user's messages")
      )
    )
    .addSubcommand((subcommand) => //* unban <user> <reason>
      subcommand
        .setName("unban")
        .setDescription("Unban a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to unban")
            .setRequired(true)
      )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the unban")
            .setRequired(true)
      )
    )
     .addSubcommand((subcommand) => //* kick <user> <reason> [delete messages (true/false)]
      subcommand
        .setName("kick")
        .setDescription("Kick a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to kick")
            .setRequired(true)
      )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for the kick")
            .setRequired(true)
      )
        .addBooleanOption((option) =>
          option
            .setName("delete-messages")
            .setDescription("Delete the user's messages")
        )
      )
          .addSubcommand((subcommand) => //* mute <user> <reason> [remove] [duration] [delete messages (true/false)]
            subcommand
              .setName("mute")
              .setDescription("Mute a user")
              .addUserOption((option) =>
                option
                  .setName("user")
                  .setDescription("The user you want to mute")
                  .setRequired(true)
              )
              .addStringOption((option) =>
                option
                  .setName("reason")
                  .setDescription("The reason for the mute")
                  .setRequired(true)
            )
              .addBooleanOption((option) =>
                option
                  .setName("remove")
                  .setDescription("Remove the mute on the user")
              )
              .addStringOption((option) =>
                option
                  .setName("duration")
                  .setDescription("The duration of the mute")
              )
              .addBooleanOption((option) =>
                option
                  .setName("delete-messages")
                  .setDescription("Delete the user's messages")
            )
  )
      .addSubcommand((subcommand) => //* unmute <user> <reason>
        subcommand
          .setName("unmute")
          .setDescription("Unmute a user")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user you want to unmute")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("reason")
              .setDescription("The reason for the unmute")
              .setRequired(true)
          )
  )
        .addSubcommand((subcommand) =>
        subcommand
            .setName("punish")
            .setDescription("Show the rules stored in IRIS database.")
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("User to punish")
                    .setRequired(true)
            )
            .addStringOption((option) =>
            option
                .setName("rule")
                .setDescription("The rule that the user violated.")
                .setRequired(true)
                .setAutocomplete(true)
            )
        ),
  
  
      

  
      //.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
    settings: {
      devOnly: false,
      mainOnly: false,
    }
  };
  
  export const setup = async (client:Discord.Client, RM: object) => true
  
  export async function runCommand(
    interaction: Discord.CommandInteraction,
    RM: object
  ) {
    try {
      const subcommand = (
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommand(true);


      if (subcommand == "ban") {
        await ban.runSubCommand(interaction, RM);
      } else if (subcommand == "unban") {
        await unban.runSubCommand(interaction, RM);
      } else if (subcommand == "kick") {
        await kick.runSubCommand(interaction, RM);
      } else if (subcommand == "mute") {
        await mute.runSubCommand(interaction, RM);
      } else if (subcommand == "unmute") {
        await unmute.runSubCommand(interaction, RM);
      }
   
      //! mod ban <user> <reason> [duration] [delete-messages] Bans a user for the specified duration and reason, with an option to delete the user's messages sent an hour from when the ban was issues, option defaults to true. If no duration is specifed, it should be permanent.
      //? When a ban/kick/mute is made, the bot finds the mod-log channel and posts an embed containing information about who got banned/kicked/muted, the reason and duration (if applicable), as well as who issued the punishment. The text of the embed message should be a way for IRIS to later-on determine the user's punishment. The format should be: PUNISHMENT|USERID|DURATION(seconds)|REASON|ISSUERID. Example: MUTE|301062520679170066|86400|Violated rule 3|516333697163853828, this message should also be 'covered' (between two "||"'s, ||like this||)

        const rule = (interaction.options as CommandInteractionOptionResolver).getString("rule");
        const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");

        const violatedRule = global.server.main.rules.find((rulee) => rulee.title == rule);

        if (!violatedRule) {
            return await interaction.reply({
                content: "Rule not found.",
                ephemeral: true
            })
         }

        await interaction.deferReply({ephemeral: true});
        let modLogChannel = interaction.guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText)
        if (modLogChannel) {
          modLogChannel = await modLogChannel.fetch()
        }

        let usersOffenses = global.server.main.offenses[user.id]?.filter((offense) => offense.violation == violatedRule.title && offense.active == true);

        const userOffenseCount = usersOffenses?.length || 0;

        let manualReview = false;

        if (userOffenseCount >= violatedRule.punishments.length) {
            manualReview = true;
        }


        if (!manualReview) {
          const newOffense = {
              violation: violatedRule.title,
              punishment_type: violatedRule.punishments[userOffenseCount].type,
              active: true,
              violated_at: new Date().toISOString(),
              ends_at: violatedRule.punishments[userOffenseCount].time ? new Date(Date.now() + parseDuration(violatedRule.punishments[userOffenseCount].time)).toISOString() : null,
              expires_at: null,
              offense_count: userOffenseCount+1,
              
              action_taken_by: interaction.user.id
            }

          if (!global.server.main.offenses[user.id]) {
              global.server.main.offenses[user.id] = [newOffense]
          } else {
              global.server.main.offenses[user.id].push(newOffense)
          }
        
          if (newOffense.punishment_type == "WARNING") {
              await user.send({
                  embeds: [
                      new Discord.EmbedBuilder()
                      .setAuthor({
                          name: user.displayName,
                          iconURL: user.displayAvatarURL()
                      })
                      .setDescription(`Hello ${user.displayName},\n\nWe have determined that your recent actions in the server have violated rule\n**${violatedRule.index}: ${violatedRule.title}**\n\nAs a result of your aforementioned behavior, you have been warned.\n\nThis is your **${getOrdinalNum(userOffenseCount+1)}** violation of this rule. Any further violations may result in a more severe punishment.`)
                      .addFields({name:"Type", value:"Warning"})
                      .setColor(Discord.Colors.Yellow)
                      .setFooter({
                          text: "Sent from " + interaction.guild.name,
                          iconURL: interaction.guild.iconURL()
                      })
                      .setTimestamp()
                  ]
              })
          } else if (newOffense.punishment_type == "TIMEOUT") {

                const discordTimestamp = "<t:"+ Math.floor(new Date(newOffense.ends_at).getTime() / 1000) + ":R>"
                await user.send({
                  embeds: [
                      new Discord.EmbedBuilder()
                      .setAuthor({
                          name: user.displayName,
                          iconURL: user.displayAvatarURL()
                      })
                      .setDescription(`Hello ${user.displayName},\n\nWe have determined that your recent actions in the server have violated rule\n**${violatedRule.index}: ${violatedRule.title}**\n\nAs a result of your aforementioned behavior, you have been ${violatedRule.punishments[userOffenseCount].time ? "temporarily ":""}timed out for the duration of **${violatedRule.punishments[userOffenseCount].time ?? "Indefinite"}**. ${violatedRule.punishments[userOffenseCount].time?"Your timeout ends "+discordTimestamp+".\n\nAfter this time has passed, you may continue interacting with the server.":""}\n\nThis is your **${getOrdinalNum(userOffenseCount+1)}** violation of this rule. Any further violations may result in a more severe punishment.`)
                      .addFields({name:"Type", value:"Timeout", inline: true}, {name:"Duration", value: newOffense.ends_at ? formatDuration(new Date(newOffense.ends_at).getTime() - Date.now()) : "∞", inline: true})
                      .setColor(Discord.Colors.Orange)
                      .setFooter({
                          text: "Sent from " + interaction.guild.name,
                          iconURL: interaction.guild.iconURL()
                      })
                      .setTimestamp()
                  ]
              })
          } else if (newOffense.punishment_type == "KICK") {
              await user.send({
                  embeds: [
                      new Discord.EmbedBuilder()
                      .setAuthor({
                          name: user.displayName,
                          iconURL: user.displayAvatarURL()
                      })
                      .setDescription(`Hello ${user.displayName},\n\nWe have determined that your recent actions in the server have violated rule\n**${violatedRule.index}: ${violatedRule.title}**\n\nAs a result of your aforementioned behavior, you have been kicked from the server.\n\nThis is your **${getOrdinalNum(userOffenseCount+1)}** violation of this rule. Any further violations may result in a more severe punishment.`)
                      .addFields({name:"Type", value:"Kick"})
                      .setColor(Discord.Colors.Orange)
                      .setFooter({
                          text: "Sent from " + interaction.guild.name,
                          iconURL: interaction.guild.iconURL()
                      })
                      .setTimestamp()
                  ]
              })
              await interaction.guild.members.kick(user.id, "Violated rule "+violatedRule.index+": "+violatedRule.title)
          }


          if (modLogChannel) {
            (modLogChannel as TextChannel).send({
              // who banned, who got banned, reason, time, duration, type
              embeds: [
                  new Discord.EmbedBuilder()
                    .setThumbnail(user.displayAvatarURL())
                    .setAuthor({
                      name: user.username + " (" + user.id + ")",
                      iconURL: user.displayAvatarURL()
                    })
                    .addFields(
                        {name: "Type", value: punishmentTypeMap[newOffense.punishment_type], inline: true},
                        ...(newOffense.ends_at ? [{name: "Duration", value: violatedRule.punishments[userOffenseCount].time, inline: true}]:[]),
                        {name: "Offense Count", value: newOffense.offense_count.toString(), inline: true},
                        {name: "Violated Rule", value: violatedRule.index + "\\. " + violatedRule.title}
                        )
                    .setColor(
                      newOffense.punishment_type == "WARNING" ? Discord.Colors.Yellow     :
                      newOffense.punishment_type == "TIMEOUT" ? Discord.Colors.Orange     :
                      newOffense.punishment_type == "KICK"    ? Discord.Colors.DarkOrange :
                      Discord.Colors.Red
                    )
                    // .setFooter({
                    //   text: interaction.guild.name,
                    //   iconURL: interaction.guild.iconURL()
                    // })
                    .setTimestamp()
                    .setFooter({
                      text: "Action taken by " + interaction.user.username,
                      iconURL: interaction.user.displayAvatarURL()
                    })
              ],
            })}

          return await interaction.editReply({
              embeds: [
                  new Discord.EmbedBuilder()
                  .setDescription(`Punished ${user} for violating rule:\n**${violatedRule.index}: ${violatedRule.title}**`)
                  .addFields(
                      {name: "Type", value: punishmentTypeMap[newOffense.punishment_type], inline: true},
                      ...(newOffense.ends_at ? [{name: "Duration", value: violatedRule.punishments[userOffenseCount].time, inline: true}]:[]),
                      {name: "Offense Count", value: newOffense.offense_count.toString(), inline: true},
                      )
                  .setColor(Discord.Colors.Red)
                  .setTimestamp()
              ]
          });
        } else {

          // Trigger a manual review, meaning time the user out for 28d, with reason: Your recent actions have been flagged for manual review. You will be unable to interact with the server until the review is complete. then send a message in mod-logs and DM the user that they have been flagged for manual review and that they will be unable to interact with the server until the review is complete.
          // dont add it to the offenses array, nor make a newOffenses object, just send the message and log it
          
          let modLogChannel = interaction.guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText)
          if (modLogChannel) {
            modLogChannel = await modLogChannel.fetch()
          }

          await user.send({
              embeds: [
                  new Discord.EmbedBuilder()
                  .setAuthor({
                      name: user.displayName,   
                      iconURL: user.displayAvatarURL()
                  })
                  .setDescription(`Hello ${user.displayName},\n\nWe have determined that your recent actions in the server have violated rule:
                  **${violatedRule.index + ". " + violatedRule.title}**\n\nThis case has been flagged for manual review. You will be unable to interact with the server until the review is complete.\n\nAfter the review is complete, you will be DM:d once again with the results of the review. The review will determine whether your actions combined with your past offenses are eligible for a permanent explusion from the server. If they are, you will be permanentely banned from the server. If the moderators deem your case to be ineligible - you will be allowed to continue interacting with the server.\n\nKeep in mind that the moderators are also able to give you another punishment if they deem that to be neccessary.`)
                  .addFields({name:"Type", value:"Manual Review"})
                  .setColor(Discord.Colors.Red)
                  .setFooter({
                      text: "Sent from " + interaction.guild.name,
                      iconURL: interaction.guild.iconURL()
                  })
                  .setTimestamp()
              ]
          })

          if (modLogChannel) {
            (modLogChannel as TextChannel).send({
              // who banned, who got banned, reason, time, duration, type
              embeds: [
                  new Discord.EmbedBuilder()
                    .setThumbnail(user.displayAvatarURL())
                    .setDescription(`${user} has gone past the maximum amount of offenses for rule \n**${violatedRule.index}. ${violatedRule.title}**\n\nIRIS has been configured to flag any case going above the offense limit as a manual review.\n\nOnce a decision has been made - use the \`/mod review\` command to review this case.`)
                    .setAuthor({
                      name: user.username + " (" + user.id + ")",
                      iconURL: user.displayAvatarURL()
                    })
                    .addFields(
                        {name: "Type", value: "Manual Review", inline: true},
                        {name: "Offense Count", value: (userOffenseCount+1).toString(), inline: true},
                        {name: "Violated Rule", value: violatedRule.index + "\\. " + violatedRule.title}
                        )
                    .setColor(Discord.Colors.NotQuiteBlack)
                    // .setFooter({
                    //   text: interaction.guild.name,
                    //   iconURL: interaction.guild.iconURL()
                    // })
                    .setTimestamp()
                    .setFooter({
                      text: "Action taken by " + interaction.user.username,
                      iconURL: interaction.user.displayAvatarURL()
                    })
              ],
            })}
          
            await (await interaction.guild.members.fetch(user.id)).timeout(parseDuration("28d"), "Manual Review")

          return await interaction.editReply({
              embeds: [
                  new Discord.EmbedBuilder()
                  .setDescription(`Flagged ${user} for manual review for violating rule:\n**${violatedRule.index}: ${violatedRule.title}**`)
                  .addFields(
                      {name: "Type", value: "Manual Review", inline: true},
                      {name: "Offense Count", value: userOffenseCount.toString(), inline: true},
                      )
                  .setColor(Discord.Colors.Red)
                  .setTimestamp()
              ]
          });
        }
          
    } catch (e) {
      await interaction.client.application.fetch();
      global.logger.error(e, returnFileName());
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "⚠️ There was an error while executing this command!" +
            (global.app.config.showErrors == true
              ? "\n\n``" +
                (global.app.owners.includes(interaction.user.id)
                  ? e.stack.toString()
                  : e.toString()) +
                "``"
              : ""),
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "⚠️ There was an error while executing this command!" +
            (global.app.config.showErrors == true
              ? "\n\n``" +
                (global.app.owners.includes(interaction.user.id)
                  ? e.stack.toString()
                  : e.toString()) +
                "``"
              : ""),
          ephemeral: true,
        });
      }
    }
  }
  
  export const autocomplete = async (interaction: Discord.AutocompleteInteraction, RM: object) => {
      
    if (interaction.options.getSubcommand() == "punish") {
        const focusedValue = interaction.options.getFocused();
        const choices = global.server.main.rules.map((rule) => {
            return {
                name: `${rule.index}. ${rule.title}`,
                value: `${rule.title}`
            }
        })
           
        await interaction.respond(choices.filter((choice) => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25));
    }
  }

  function formatDuration(durationMs) {
    const units = [
        { label: 'y', ms: 1000 * 60 * 60 * 24 * 365 },
        { label: 'mo', ms: 1000 * 60 * 60 * 24 * 31},
        { label: 'w', ms: 1000 * 60 * 60 * 24 * 7 },
        { label: 'd', ms: 1000 * 60 * 60 * 24 },
        { label: 'h', ms: 1000 * 60 * 60 },
        { label: 'm', ms: 1000 * 60 },
        { label: 's', ms: 1000 },
        { label: 'ms', ms: 1 }
    ];
  
    let duration = durationMs;
    let durationStr = '';
  
    for (const unit of units) {
        const count = Math.floor(duration / unit.ms);
        if (count > 0) {
            durationStr += `${count}${unit.label} `;
            duration -= count * unit.ms;
        }
    }
  
    return durationStr.trim();
  }
  
  function parseDuration(durationStr) {
    const units = {
        'ms': 1,
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000,
        'mo': 1000 * 60 * 60 * 24 * 31,
        'y': 365 * 24 * 60 * 60 * 1000
    };
    
    const time = parseInt(durationStr.replace(/[a-zA-Z]/g,""))
    const unit = durationStr.match(/[a-zA-Z]/g).join("")  
  
    const duration = time * units[unit];
    return duration;
  }
    /* prettier-ignore */
    const getOrdinalNum = (n:number)=> { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }

  
  export const returnFileName = () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
    ];
  export const getSlashCommand = () => commandInfo.slashCommand;
  export const commandSettings = () => commandInfo.settings;
