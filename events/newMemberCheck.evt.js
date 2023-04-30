const eventInfo = {
  type: "runEvery",
  ms: 12 * 60 * 60 * 1000, //12h
  runImmediately: true,
};
let running = false;
let moment = require("moment-timezone");
let Discord = require("discord.js");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.Client} client
 * @param {*} RM
 */
async function runEvent(client, RM) {
  running = true;
  // -----------
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  let updated = [];
  let newMembersRole = null;
  await guild.roles.fetch().then((roles) => {
    roles.forEach((role) => {
      if (role.name.toLowerCase().includes("new member")) {
        newMembersRole = role;
      }
    });
  });
  for (let memberID of JSON.parse(JSON.stringify(global.newMembers))) {
    await guild.members.fetch(memberID).then(async (member) => {
      if (member.user.bot) return;
      if (new Date() - member.joinedAt >= 7 * 24 * 60 * 60 * 1000) {
        global.newMembers = global.newMembers.filter(
          (item) => item !== memberID
        );
        /* prettier-ignore */
        global.app.debugLog(global.chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+"Removing '"+newMembersRole.name+"' (role) from "+global.chalk.yellow(member.user.tag));
        member.roles.remove(newMembersRole);
        updated.push(memberID);
      }
    });
    if (updated.length > 0) {
      const client = new MongoClient(global.mongoConnectionString);
      try {
        const database = client.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
        for (let index in updated) {
          updated[index] = { id: updated[index] };
        }
        await userdata.updateMany(
          { $or: updated },
          {
            $set: {
              isNew: false,
            },
          }
        );
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
    }
  }
  // -----------
  running = false;
}
module.exports = {
  runEvent,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  eventType: () => eventInfo.type,
  priority: () => 0,
  getMS: () => eventInfo.ms,
  running,
  runImmediately: () => eventInfo.runImmediately,
};
