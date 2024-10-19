require('dotenv').config()

const TelegramBotApi = require('node-telegram-bot-api')

const { keyboards } = require('./keyboards.js')
const { getMessageInfo, getQueryInfo, sortDates, splitMessage } = require('./utils.js')
const { DB } = require('./db.js')

const db = new DB(process.env.DB_URL)
const bot = new TelegramBotApi(process.env.BOT_TOKEN, { polling: true })

bot.setMyCommands([
    { command: '/start', description: 'Запустить бота' }
])

bot.onText('/start', async (ctx) => {
    const [chatId, , userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)

    if (user.isAdmin) {
        return bot.sendPhoto(chatId, './public/img/startAdmin.jpg', keyboards.startAdminKeyboard)
    }
    return bot.sendPhoto(chatId, './public/img/start.jpg', keyboards.startGuideKeyboard)
})

bot.onText('Мерч', async (ctx) => {
    const [chatId, userName, userId] = getMessageInfo(ctx)

    const user = await db.getUsersById(userId)
    let message = `Здесь вы можете добавить проданный мерч нажав на значок «+»\n\nЗа этот месяц вы упорным трудом продали:\n\n${user.bags} шопперов 💰\n${user.stickers} стикеров 💸`

    bot.sendMessage(chatId, message, keyboards.merchGuideKeyboard)
})

bot.onText('Посмотреть выходы', async (ctx) => {
    const [chatId, userName, userId] = getMessageInfo(ctx)
    const userWalkings = await db.findUserWalkings(userId)
    const userWalkingsSorted = sortDates(userWalkings)
    const user = await db.getUsersById(userId)
    let guideWalkingsText = ''
    let message = ''


    if (user.isAdmin) {
        const walkings = await db.findAllWalkings()
        const walkingsSorted = sortDates(walkings)
        walkingsSorted.forEach(walking => guideWalkingsText += `${walking.date}, Время: ${walking.time}, Цена: ${walking.price}, Гид: ${walking.guideName}${walking.comment ? `\n${walking.comment}` : ''}\n\n`)
        message = walkings.length > 0 ? `Здесь вы можете посмотреть предстоящие выходы 👷‍♂️:\n\n${guideWalkingsText}` : 'Босс, извините, но вы не назначили еще ни одного выхода 🤷‍♂️'

        const splitedMessage = splitMessage(message)

        splitedMessage.forEach(msg => bot.sendMessage(chatId, msg))

        return
    }

    userWalkingsSorted.forEach(walking => guideWalkingsText += `${walking.date}, Время: ${walking.time}, Цена: ${walking.price}${walking.comment ? `\n${walking.comment}` : ''}\n\n`)
    message = userWalkings.length > 0 ? `Здесь вы можете посмотреть предстоящие выходы 👷‍♂️:\n\n${guideWalkingsText}` : 'На данный момент у вас нет ни одного выхода, самое время отдохнуть ! 💆‍♂️'
    const splitedMessage = splitMessage(message)

    splitedMessage.forEach(msg => bot.sendMessage(chatId, msg))
})

bot.onText('Добавить выход', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nСоздать: дата(dd.mm.yy), время(hh:mm), цена, гид, комент')
})

bot.onText('Удалить выход', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nУдалить: дата(dd.mm.yy), время(hh:mm), Гид')
})

bot.onText('Редактировать выход', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nИзменить: дата(dd.mm.yy), время(hh:mm), новое время(hh:mm), новая цена, новый гид, коментарий')
})

bot.on('callback_query', async (ctx) => {
    const [chatId, , userId, data] = getQueryInfo(ctx)
    const merchMessageId = ctx.message.message_id

    if (data == 'addStickers') {
        const response = await db.updateUsersMerchStatus(userId, 'addStickers')
        if (response == 1) {
            bot.sendMessage(chatId, 'Стикер успешно добавлен, Ты молодец 👏')
        } else {
            bot.sendMessage(chatId, 'Произошла ошибка при добавлении шопера ⭕️')
        }
    }

    if (data == 'addBag') {
        const response = await db.updateUsersMerchStatus(userId, 'addBag')
        if (response == 1) {
            bot.sendMessage(chatId, 'Шоппер успешно добавлен, отличная работа! 🙌')
        } else {
            bot.sendMessage(chatId, 'Произошла ошибка при добавлении шопера ⭕️')

        }
    }

    if (data == 'deleteStickers') {
        const response = await db.updateUsersMerchStatus(userId, 'deleteStickers')
        if (response == 1) {
            bot.sendMessage(chatId, 'Стикеры успешно удалены✅')
        } else {
            bot.sendMessage(chatId, 'У вас и так 0 стикеров ;(')
        }
    }

    if (data == 'deleteBag') {
        const response = await db.updateUsersMerchStatus(userId, 'deleteBag')
        if (response == 1) {
            bot.sendMessage(chatId, 'Шопер успешно удален✅')
        } else {
            bot.sendMessage(chatId, 'У вас и так 0 шоперов ;(')
        }
    }

    const user = await db.getUsersById(userId)

    bot.editMessageText(`Здесь вы можете добавить проданный мерч нажав на значок «+»\n\nЗа этот месяц вы упорным трудом продали:\n\n${user.bags} шопперов 💰\n${user.stickers} стикеров 💸`, { chat_id: chatId, message_id: merchMessageId, reply_markup: keyboards.merchGuideKeyboard.reply_markup })
})

bot.onText(/Создать:/, async (ctx) => {
    const [chatId, , userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)

    if (user.isAdmin) {

        const [date, time, price, guideName, comment] = ctx.text.substring(9).split(', ')
        if (date && time && price && guideName) {
            const response = await db.createNewWalking(date, time, price, guideName, comment)

            if (response) {
                bot.sendMessage(chatId, 'Выход успешно добавлен!✅')
                return
            } else {
                bot.sendMessage(chatId, 'Произошла ошибка при добавлении выхода⭕️')
            }
            return
        } else {
            bot.sendMessage(chatId, 'Введите команду правильно!')
            return
        }
    }
    bot.sendMessage(chatId, 'У вас нет прав на использование этой команды❌')
})

bot.onText(/Удалить:/, async (ctx) => {
    const [chatId, , userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)

    if (user.isAdmin) {

        const [date, time, guideName] = ctx.text.substring(9).split(', ')

        if (date && time && guideName) {

            const response = await db.deleteWalking(date, time, guideName)
            if (response) {
                bot.sendMessage(chatId, 'Выход успешно удален ✅')
                return
            }

            bot.sendMessage(chatId, 'Произошла ошибка при попытке удаления выхода⭕️')
            return

        } else {
            bot.sendMessage(chatId, 'Введите данные в верном формате!')
            return
        }
    }

    bot.sendMessage(chatId, 'У вас нет прав на использование этой команды❌')
})

bot.onText(/Изменить:/, async (ctx) => {
    const [chatId, , userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)

    if (user.isAdmin) {
        const [date, time, newTime, price, guideName, comment] = ctx.text.substring(10).split(', ')

        if (date && time && newTime && price && guideName) {
            const response = await db.changeWalking(date, time, newTime, price, guideName, comment)

            if (response) {
                bot.sendMessage(chatId, 'Выход успешно редактирован✅')
                return
            }
            bot.sendMessage(chatId, 'Произошла ошибка при попытке редактировании выхода⭕️')
            return
        } else {
            bot.sendMessage(chatId, 'Введите команду правильно!')
            return
        }
    }
    bot.sendMessage(chatId, 'У вас нет прав на использование этой команды❌')
})