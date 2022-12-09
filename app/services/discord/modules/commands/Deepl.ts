import {
	ApplicationCommandOptionChoice,
	ApplicationCommandType,
	AutocompleteContext,
	CommandContext,
	CommandOptionType,
	SlashCommand,
	SlashCreator,
} from "slash-create";
import { DiscordBot } from "../..";
import { EphemeralResponse } from ".";
import QueryString from "qs";
import axios, { AxiosResponse } from "axios";
import config from "@/config/deepl.json";

const LANG = [
	"BG",
	"CS",
	"DA",
	"DE",
	"EL",
	"EN-GB",
	"EN-US",
	"EN",
	"ES",
	"ET",
	"FI",
	"FR",
	"HU",
	"IT",
	"JA",
	"LT",
	"LV",
	"NL",
	"PL",
	"PT-PT",
	"PT-BR",
	"PT",
	"RO",
	"RU",
	"SK",
	"SL",
	"SV",
	"TR",
	"UK",
	"ZH",
] as const;

type SupportedLanguages = typeof LANG[number];

interface DeeplResponse {
	translations: {
		detected_source_language: string;
		text: string;
	}[];
}
interface DeeplOptions {
	auth_key: string;
	text: string;
	source_lang?: SupportedLanguages;
	target_lang: SupportedLanguages;
	split_sentences?: "0" | "1" | "nonewlines";
	preserve_formatting?: "0" | "1";
	formality?: "default" | "more" | "less" | "prefer_more" | "prefer_less";
	glossary_id?: string;
}

async function translate(options: DeeplOptions): Promise<AxiosResponse<DeeplResponse>> {
	return axios.post("https://api-free.deepl.com/v2/translate", QueryString.stringify(options));
}

export class SlashDeeplCommand extends SlashCommand {
	constructor(bot: DiscordBot, creator: SlashCreator) {
		super(creator, {
			name: "deepl",
			description: "translate using deepl.",
			deferEphemeral: true,
			guildIDs: [bot.config.guildId],
			options: [
				{
					name: "text",
					description: "text to translate",
					type: CommandOptionType.STRING,
					required: true,
				},
				{
					name: "to",
					description: "language to translate to",
					type: CommandOptionType.STRING,
					autocomplete: true,
				},
				{
					name: "from",
					description: "language to translate to",
					type: CommandOptionType.STRING,
					autocomplete: true,
				},
			],
		});
		this.filePath = __filename;
	}
	async autocomplete(ctx: AutocompleteContext): Promise<any> {
		return LANG.filter(
			function (entry) {
				if (this.limit < 25) {
					this.limit++;
					return entry.includes(ctx.options[ctx.focused]);
				}
			},
			{ limit: 0 }
		).map(lang => {
			return { name: lang, value: lang } as ApplicationCommandOptionChoice;
		});
	}

	async run(ctx: CommandContext): Promise<any> {
		const text = ctx.options.text;
		if (text && Buffer.from(text).length < 128 * 1024) {
			const res = await translate({
				auth_key: config.key,
				text: ctx.options.text,
				target_lang: ctx.options.to ?? "EN",
				source_lang: ctx.options.from,
			});
			if (res) {
				return `**${res.data.translations[0].detected_source_language} -> ${
					ctx.options.to ?? "EN"
				}**\`\`\`\n${res.data.translations[0].text}\`\`\``;
			} else {
				return EphemeralResponse("Something went wrong while trying to translate.");
			}
		} else {
			return EphemeralResponse("Text too big!");
		}
	}
}

export class UIDeeplCommand extends SlashCommand {
	constructor(bot: DiscordBot, creator: SlashCreator) {
		super(creator, {
			name: "deepl translate",
			deferEphemeral: true,
			guildIDs: [bot.config.guildId],
			type: ApplicationCommandType.MESSAGE,
		});
		this.filePath = __filename;
	}

	async run(ctx: CommandContext): Promise<any> {
		const text = ctx.targetMessage?.content;
		if (text && Buffer.from(text).length < 128 * 1024) {
			const res = await translate({
				auth_key: config.key,
				text: text,
				target_lang: "EN",
			});
			if (res) {
				return `**${res.data.translations[0].detected_source_language} -> ${
					ctx.options.to ?? "EN"
				}**\`\`\`\n${res.data.translations[0].text}\`\`\``;
			} else {
				return EphemeralResponse("Something went wrong while trying to translate.");
			}
		} else {
			return EphemeralResponse("Can't find text to translate or text is too big.");
		}
	}
}
