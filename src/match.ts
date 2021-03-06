import { BotContext, SessionData } from '.'
import { initializeGame } from './game'

async function assignPartnerToSelf(
    ctx: BotContext,
    partnerId: string
): Promise<void> {
    // set id and name of partner
    const partnerName =
        (await ctx.telegram.getChat(partnerId)).first_name ?? 'Anonym'
    ctx.session.matchedPartner = {
        id: parseInt(partnerId, 10),
        name: partnerName,
    }
    // set status to in-game
    ctx.session.state = 'in-game'
}

function assignSelfToPartner(ctx: BotContext, partner: SessionData): void {
    // set id and name of self
    const selfId = ctx.chat?.id ?? 0
    const selfName = ctx.chat?.first_name ?? 'Anonym'
    partner.matchedPartner = {
        id: selfId,
        name: selfName,
    }
    // set status to in-game
    partner.state = 'in-game'
}

// called upon /match command
export async function match(ctx: BotContext): Promise<void> {
    const sessions = ctx.db.db.get('sessions').value()
    // first try to find someone that matches
    const partners = sessions.filter(s => s.data.state === 'looking for match')
    if (partners.length === 0) {
        // no one is looking for a match currently (FIXME: except concurrency)
        ctx.session.state = 'looking for match'
        await ctx.reply('Ich suche nach einem Partner für dich ...')
    } else {
        // found match!

        // set id and name of partner
        const partnerId = partners[0].id
        const partnerSession = ctx.db.getSession(partnerId)
        await assignPartnerToSelf(ctx, partnerId)
        assignSelfToPartner(ctx, partnerSession)
        initializeGame(ctx, partnerSession)
        ctx.db.saveSession(partnerId, partnerSession)
    }
}
