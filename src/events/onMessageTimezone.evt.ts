/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
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

import Discord from "discord.js";
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onMessage",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(message: Discord.Message, RM: object) {
  if (message.guildId != global.app.config.mainServer) return;
  if (message.author.id == message.client.user.id) return;
  if (
    message.content.toLowerCase().includes("timezone") ||
    message.content.toLowerCase().includes("time zone")
  ) {
    const user = message.author.discriminator != "0" && message.author.discriminator ? message.author.tag: message.author.username
    /* prettier-ignore */
    global.logger.debug(`Timezone message registered by ${chalk.yellow(user)}.`, returnFileName())
    let time: any = message.content
      .replace(/<.*?>/gim, "")
      .toLowerCase()
      .trim()
      .match(
        /([0-9]{1,2}:[0-9]{2}( |)(am|pm))|([0-9]{1,2}:[0-9]{2})|[0-9]{4}|[0-9]{1,2}( |)(am|pm)/gim
      );
    if (!time) {
      /* prettier-ignore*/
      global.logger.debug(`No matching time format was detected in the timezone message by ${chalk.yellow(user)}.`, returnFileName())
      return;
    }
    time = time[0];
    let zones = [
      "Pacific/Pago_Pago", // -11
      "Pacific/Honolulu", // -10
      "Pacific/Marquesas", // -9:30
      "Pacific/Gambier", // -9
      "Pacific/Pitcairn", // -8
      "America/Phoenix", // -7
      "America/Belize", // -6
      "America/Atikokan", // -5
      "America/Detroit", // -4
      "America/Montevideo", // -3
      "America/St_Johns", // -2:30
      "America/Noronha", // -2
      "Atlantic/Cape_Verde", // -1
      "Europe/London", // 0
      "Europe/Berlin", // +1
      "Europe/Kyiv", // +2
      "Europe/Moscow", // +3
      "Asia/Tehran", // +3:30
      "Asia/Dubai", // +4
      "Asia/Kabul", // +4:30
      "Indian/Maldives", // +5
      "Asia/Kolkata", // +5:30
      "Asia/Kathmandu", // +5:45
      "Indian/Chagos", // +6
      "Asia/Yangon", // +6:30
      "Asia/Bangkok", // +7
      "Asia/Macau", // +8
      "Australia/Eucla", // +8:45
      "Pacific/Palau", // +9
      "Australia/Darwin", // +9:30
      "Australia/Brisbane", // +10
      "Australia/Broken_Hill", // +10:30
      "Antarctica/Macquarie", // +11
      "Pacific/Fiji", // +12
      "Pacific/Kanton", // +13
      "Pacific/Chatham", // +13:45
      "Pacific/Kiritimati", // +14
    ];
    let timeFormat = "";
    if (time.match(/([0-9]{1,2}:[0-9]{2}( |)(am|pm))/gim))
      timeFormat = "AMPM"; //* 12:11 pm, 1:00 am, 1:20pm
    else if (time.match(/([0-9]{1,2}:[0-9]{2})/gim))
      timeFormat = "24HCLOCK"; //* 23:59, 13:23, 02:43
    else if (time.match(/[0-9]{4}/gim))
      timeFormat = "MILITARY"; //* 1234, 2123. 2232
    else if (time.match(/[0-9]{1,2}( |)(am|pm)/gim)) timeFormat = "AMPMSINGLE"; //* 9pm, 2 am, 3pm,
    /* prettier-ignore */
    global.logger.debug(`Time format was recognized as: ${chalk.yellow(timeFormat)} in ${chalk.yellow(user)}'s timezone message.`, returnFileName())

    if (timeFormat == "AMPMSINGLE") {
      if (time.split(" ").length == 2) {
        let timeSplit = time.split(" ");
        time = (timeSplit[0] + ":00 " + timeSplit[1]).toLowerCase();
      } else {
        let timeCopy = time.trim().split("");
        timeCopy.splice(timeCopy.length - 2, 0, " ");
        timeCopy = timeCopy.join("").split(" ");
        time = (timeCopy[0] + ":00 " + timeCopy[1]).toLowerCase();
      }
    } else if (timeFormat == "AMPM") {
      if (time.split(" ").length == 2) {
        time = time.toLowerCase();
      } else {
        let timeCopy = time.trim().split("");
        timeCopy.splice(timeCopy.length - 2, 0, " ");
        time = timeCopy.join("").toLowerCase();
      }
    } else if (timeFormat == "24HCLOCK") {
      time = tConvert(time.trim());
    } else if (timeFormat == "MILITARY") {
      let timeSplit = time.trim().split("");
      time = tConvert(
        timeSplit[0] + timeSplit[1] + ":" + (timeSplit[2] + timeSplit[3])
      );
    }
    if (new Date("2 Jan 1970 " + time).toString() == "Invalid Date") {
      /* prettier-ignore */
      global.logger.debug(`Time provided by ${chalk.yellow(user)} in their timezone message is not valid.`, returnFileName())
      return;
    }
    let approximatedTimezone = null;
    let oneMinuteBefore = addRemoveTime(time, -1);
    let oneMinuteAfter = addRemoveTime(time, 1);
    for (let timezone of zones) {
      if (
        [oneMinuteBefore, time, oneMinuteAfter].includes(
          moment().tz(timezone).format("h:mm a")
        )
      ) {
        approximatedTimezone = timezone;
      }
    }
    if (!approximatedTimezone) {
      /* prettier-ignore */
      global.logger.debug(`Time provided by ${chalk.yellow(user)} did not match any timezone`, returnFileName())

      return;
    }
    const timezonePlusOffset = `${approximatedTimezone} (${getOffset(approximatedTimezone)})`
    /* prettier-ignore */
    global.logger.debug(`Time provided by ${chalk.yellow(user)} was matched to timezone: ${chalk.yellow(timezonePlusOffset)}`,returnFileName())

    const client = new MongoClient(global.mongoConnectionString);
    try {
      const database = client.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
      const userdata = database.collection(
        global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
      );
      let a;
      // Query for a movie that has the title 'Back to the Future'
      const query = { id: message.author.id };
      let userInfo = await userdata.findOne(query);
      if (userInfo?.settings?.changeTimezone) {

        
        let timezones = [...userInfo.timezones, approximatedTimezone];
      if (timezones.length >= 5) timezones.shift();
      let moded = mode(timezones);
      const approximatedPlusOffset = `${moded} (${getOffset(moded)})`
      /* prettier-ignore */
      global.logger.debug(`${chalk.yellow(user)}'s timezone is now approximated to be ${chalk.yellow(approximatedPlusOffset)}`, returnFileName());
      await userdata.updateOne(
        query,
        {
          $set: {
            approximatedTimezone: moded,
          },
          $push: {
            timezones: approximatedTimezone,
          },
        },
        {}
      );
      await userdata.updateOne(
        { ...query, timezones: { $size: 5 } },
        {
          $pop: { timezones: -1 },
        },
        {}
      );
      if (
        global.birthdays.some((birthday) => birthday.id === message.author.id)
      ) {
        let birthday = global.birthdays.find(
          (birthday) => birthday.id === message.author.id
        );
        birthday.timezone = moded;
        let copy = global.birthdays.filter(
          (obj) => obj.id !== message.author.id
          );
          copy.push(birthday);
        global.birthdays = copy;
      }
     } else {
        /* prettier-ignore */
        global.logger.debug(`${chalk.yellow(user)} has manually set their timezone, we will not be changing it.`, returnFileName())
        
     }
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
}
function addRemoveTime(time, change) {
  if (change < -1 || change > 1) return "change max -1 / 1";
  let timeObj = moment(new Date("2 Jan 1970 " + time));
  timeObj.add(change, "minutes");
  return timeObj.format("h:mm a");
}
function mode(arr) {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
}
function getOffset(timezone) {
  let offset = moment().tz(timezone).utcOffset() / 60;
  let stringOffset = "";
  if (offset !== 0) {
    if (offset < 0) {
      stringOffset += "-";
    } else {
      stringOffset += "+";
    }
    if (offset.toString().includes(".")) {
      let fullHourOffset = Math.abs(offset);
      let minuteOffset = 60 * (Math.abs(offset) - fullHourOffset);
      stringOffset += fullHourOffset + ":" + minuteOffset;
    } else {
      stringOffset += Math.abs(offset);
    }
  }
  return "UTC" + stringOffset;
}
function tConvert(time: any) {
  // Check correct time format and split into components
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [
    time,
  ];

  if (time.length > 1) {
    // If time format correct
    time = time.slice(1); // Remove full string match value
    time[5] = +time[0] < 12 ? " am" : " pm"; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join(""); // return adjusted time or original string
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 0;
