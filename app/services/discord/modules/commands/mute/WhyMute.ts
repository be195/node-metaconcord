import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from "slash-create";
import { DiscordBot } from "@/app/services";
import { EphemeralResponse } from "..";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export class SlashWhyMuteCommand extends SlashCommand {
	private bot: DiscordBot;

	constructor(bot: DiscordBot, creator: SlashCreator) {
		super(creator, {
			name: "whymute",
			description: "Prints the reason and duration for a muted user.",
			guildIDs: [bot.config.guildId],
			options: [
				{
					type: CommandOptionType.USER,
					name: "user",
					description:
						"The Discord user for which we want the reason/duration of the mute",
					required: false,
				},
			],
		});

		this.filePath = __filename;
		this.bot = bot;
		dayjs.extend(relativeTime);
	}

	async run(ctx: CommandContext): Promise<any> {
		await ctx.defer();
		const userId = (ctx.options.user ?? ctx.user.id).toString();
		const { muted } = this.bot.container.getService("Data");
		if (muted && muted[userId]) {
			const { until, reason, muter } = muted[userId];
			const guild = await this.bot.discord.guilds.resolve(ctx.guildID)?.fetch();
			if (guild) {
				const mutedMember = await guild.members.resolve(userId)?.fetch();
				const muterMember = await guild.members.resolve(muter)?.fetch();
				if (!mutedMember || !muterMember) return "invalid user";

				const content =
					`${ctx.user.mention}, ` +
					(ctx.user.id == userId ? `you remain muted` : `${mutedMember} remains muted`) +
					(until ? ` for *${dayjs(until).fromNow()}*` : "") +
					(muterMember ? ` by ${muterMember}` : "") +
					(reason ? ` with reason:\n\n${reason}` : " without a reason") +
					`.`;
				return EphemeralResponse(content);
			} else {
				return EphemeralResponse("how#3");
			}
		} else {
			if (userId == ctx.user.id) {
				return EphemeralResponse("You're not muted... yet!");
			} else {
				return EphemeralResponse("That user hasn't been muted... yet!");
			}
		}
	}
}