import { DiscordBot } from "..";
import { join } from "path";
import { scheduleJob } from "node-schedule";
import { stat } from "fs/promises";
import moment from "moment";

const events = [
	{
		icon: "summer",
		range: ["01/06", "07/09"],
	},
	{
		icon: "halloween",
		range: ["01/10", "07/11"],
	},
	{
		icon: "christmas",
		range: ["01/12", "26/12"],
	},
	{
		icon: "new-years-eve",
		range: ["27/12", "07/01"],
	},
];
const iconsPath = join(require.main.path, "resources/discord-guild-icons");
const defaultIconPath = join(iconsPath, "default.png");

const fileExists = async filePath =>
	await stat(filePath)
		.then(stats => stats.isFile())
		.catch(() => false);

export default (bot: DiscordBot): void => {
	const data = bot.container.getService("Data");

	bot.discord.on("ready", async () => {
		const guild = await bot.discord.guilds.fetch(bot.config.guildId);

		const changeIcon = async (filePath, eventName) => {
			if (data.lastDiscordGuildIcon === eventName) return;

			try {
				await guild.setIcon(
					filePath,
					eventName ? `It's ${eventName}!` : "Back to regularly scheduled activities."
				);

				data.lastDiscordGuildIcon = eventName;
				await data.save();

				console.log("Changed server icon successfully!");
			} catch (err) {
				throw new Error(
					"Can't change guild icon: either can't fetch it, icon doesn't exist, or the bot is missing permissions to do so."
				);
			}
		};

		const checkDate = async () => {
			for (const { icon, range } of events) {
				const [start, end] = range;
				const [startDay, startMonth] = start.split("/").map(n => +n);
				const [endDay, endMonth] = end.split("/").map(n => +n);

				const now = moment();
				const day = now.date();
				const month = now.month() + 1;

				if (startDay >= day && startMonth >= month && endDay <= day && endMonth <= month) {
					let filePath = join(iconsPath, `${icon}.gif`);
					if (!(await fileExists(filePath)) || guild.premiumTier === "NONE") {
						filePath = join(iconsPath, `${icon}.png`);
					}
					if (!(await fileExists(filePath))) {
						filePath = defaultIconPath;
					}

					return {
						filePath,
						eventName: icon
							.split("-")
							.map(str => str.charAt(0).toUpperCase() + str.slice(1))
							.join(" "),
					};
				} else {
					return { filePath: defaultIconPath, eventName: "None" };
				}
			}
		};

		scheduleJob("0 0 * * *", async () => {
			const { filePath, eventName } = await checkDate();
			changeIcon(filePath, eventName);
		});
	});
};
