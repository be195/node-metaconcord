import {
	ApplicationCommandPermissionType,
	ApplicationCommandType,
	CommandContext,
	SlashCommand,
	SlashCreator,
} from "slash-create";
import { Data } from "@/app/services/Data";
import { DiscordBot } from "../../..";
import { EphemeralResponse } from "..";

export class SlashUnmuteCommand extends SlashCommand {
	private bot: DiscordBot;
	private data: Data;

	constructor(bot: DiscordBot, creator: SlashCreator) {
		super(creator, {
			name: "unmute",
			description: "Unmutes an user.",
			type: ApplicationCommandType.USER,
			guildIDs: [bot.config.guildId],
			defaultPermission: false,
			permissions: {
				[bot.config.guildId]: [
					{
						type: ApplicationCommandPermissionType.ROLE,
						id: bot.config.developerRoleId,
						permission: true,
					},
				],
			},
		});

		this.filePath = __filename;
		this.bot = bot;
		this.data = this.bot.container.getService("Data");
	}

	async run(ctx: CommandContext): Promise<any> {
		const userId = ctx.targetID;

		const { config } = this.bot;
		let { muted } = this.data;

		if (!muted) muted = this.data.muted = {};
		delete muted[userId];
		await this.data.save();

		const guild = await this.bot.discord.guilds.fetch(ctx.guildID);
		if (guild) {
			const member = await guild.members.fetch(userId);
			if (!member) return EphemeralResponse("Invalid user.");

			await member.roles.remove(config.mutedRoleId);
			return EphemeralResponse(`<@${member.id}> has been unmuted.`);
		} else {
			return EphemeralResponse("how#3");
		}
	}
}