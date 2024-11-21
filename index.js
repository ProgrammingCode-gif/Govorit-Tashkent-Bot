require('dotenv').config()

const TelegramBotApi = require('node-telegram-bot-api')

const { keyboards } = require('./keyboards.js')
const { getMessageInfo, getQueryInfo, sortDates, splitMessage, getUsersIdByName, removeSpaces, generateUniqueId } = require('./utils.js')
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
    let message = `Здесь вы можете добавить проданный мерч нажав на значок «+» 🎄🎁❄️\n\nЗа этот месяц вы упорным трудом продали:\n\n${user.bags} шопперов 💰\n${user.stickers} стикеров 💸`

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
        walkingsSorted.forEach(walking => guideWalkingsText += `----------------------------------\n${walking.date}, Время: ${walking.time}, Цена: ${walking.price}, Гид: ${walking.guideName}${walking.comment ? `\n${walking.comment}` : ''}\n\n`)
        message = walkings.length > 0 ? `Здесь вы можете посмотреть предстоящие выходы 👷‍♂️❄️🎅:\n\n${guideWalkingsText}` : 'Босс, извините, но вы не назначили еще ни одного выхода 🤷‍♂️'

        const splitedMessage = splitMessage(message)

        splitedMessage.forEach(msg => bot.sendMessage(chatId, msg))

        return
    }

    userWalkingsSorted.forEach(walking => guideWalkingsText += `----------------------------------\n${walking.date}, Время: ${walking.time}, Цена: ${walking.price}${walking.comment ? `\n${walking.comment}` : ''}\n\n`)
    message = userWalkings.length > 0 ? `Здесь вы можете посмотреть предстоящие выходы 👷‍♂️❄️🎅:\n\n${guideWalkingsText}` : 'На данный момент у вас нет ни одного выхода, самое время отдохнуть ! 💆‍♂️'
    const splitedMessage = splitMessage(message)

    splitedMessage.forEach(msg => bot.sendMessage(chatId, msg))
})

bot.onText('Добавить', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nСоздать: дата(dd.mm.yy), время(hh:mm), цена, гид(если несколько то через пробел), комент')
})

bot.onText('Удалить', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nУдалить: дата(dd.mm.yy), время(hh:mm)')
})

bot.onText('Изменить', async (ctx) => {
    const [chatId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Отправьте сообщение в формате:\nИзменить: дата(dd.mm.yy), время(hh:mm), новое время(hh:mm), новая цена, новый гид(если несколько то через пробел), коментарий')
})

bot.on('callback_query', async (ctx) => {
    const [chatId, , userId, data] = getQueryInfo(ctx)

    if (data == 'addStickers' || data == 'addBag' || data == 'deleteStickers' || data == 'deleteBag') {
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

        bot.editMessageText(`Здесь вы можете добавить проданный мерч нажав на значок «+» 🎄🎁❄️\n\nЗа этот месяц вы упорным трудом продали:\n\n${user.bags} шопперов 💰\n${user.stickers} стикеров 💸`, { chat_id: chatId, message_id: merchMessageId, reply_markup: keyboards.merchGuideKeyboard.reply_markup })
    }

    if (data == 'addNote') {
        const moneyMessageId = ctx.message.message_id

        bot.sendMessage(chatId, "Введите новую запись")

        bot.on("message", async (ctx) => {
            const text = ctx.text
            let moneyText = ''

            await db.updateConvert(text, userId);
            const convert = await db.getConvertByGuideId(userId)

            convert.forEach((note, index) => moneyText += `\n${index + 1}) ${note.text}`)
            bot.sendMessage(chatId, 'Запись успешна введена ✅')
            
            bot.editMessageText(`Это записи в вашем конверте 🎄📋✨:\n${moneyText}`, { chat_id: chatId, message_id: moneyMessageId, reply_markup: keyboards.moneyGuideKeyboard.reply_markup })
            bot.removeListener('message')
        })
    } else if (data == 'deleteNote') {
        const moneyMessageId = ctx.message.message_id
        bot.sendMessage(chatId, "Введите номер записи")

        bot.on("message", async (ctx) => {
            const text = ctx.text
            let moneyText = ''

            await db.deleteNoteFromConvert(text, userId);
            
            const convert = await db.getConvertByGuideId(userId)
            
            convert.forEach((note, index) => moneyText += `\n${index + 1}) ${note.text}`)
            bot.sendMessage(chatId, "Запись успешно удалена ✅")
            if(convert.length >= 1) {
                bot.editMessageText(`Это записи в вашем конверте 🎄📋✨:\n${moneyText}`, { chat_id: chatId, message_id: moneyMessageId, reply_markup: keyboards.moneyGuideKeyboard.reply_markup })
            } else {
                bot.editMessageText(`В вашем конверте пока пусто 🎅📭✨`, { chat_id: chatId, message_id: moneyMessageId, reply_markup: keyboards.moneyGuideKeyboard.reply_markup })
            }

            bot.removeListener('message')
        })
    } else if(data == 'cleanNotes') {
        const moneyMessageId = ctx.message.message_id
        bot.sendMessage(chatId, 'Вы уверены что хотите очистить конверт ?', keyboards.cancelDeletingConvert)

        bot.on('message', async(ctx) => {
            const text = ctx.text
            if(text == '❌') {
                bot.sendMessage(chatId, 'Отменено', keyboards.startGuideKeyboard)
                bot.removeListener('message')
            } else if(text == '✅') {

                await db.cleanConvert(userId)

                bot.editMessageText(`В вашем конверте пока пусто 🎅📭✨`, {chat_id: chatId, message_id: moneyMessageId, reply_markup: keyboards.moneyGuideKeyboard.reply_markup})
                bot.sendMessage(chatId, 'Конверт успешно очищен ✅', keyboards.startGuideKeyboard)
                bot.removeListener('message')
            }
        })

    }
})

bot.onText(/Создать:/, async (ctx) => {
    const [chatId, , userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)

    if (user.isAdmin) {

        let [date, time, price, guideNames, comment] = ctx.text.substring(9).split(', ')
        let error = false;

        date = removeSpaces(date)
        time = removeSpaces(time)
        price = removeSpaces(price)
        guideNames = guideNames.split(' ')
            .map(guideName => guideName = removeSpaces(guideName))
            .filter(guideName => guideName != '')

        const guidesId = []
        for (let i = 0; i < guideNames.length; i++) {
            const id = getUsersIdByName(guideNames[i])
            id == 0 ? error = true : ''
            guidesId.push(id)
        }
        if (date && time && price && guideNames && guidesId && !isNaN(+price) && !error) {
            const response = await db.createNewWalking(date, time, price, guideNames, comment, guidesId)

            if (response) {
                bot.sendMessage(chatId, 'Выход успешно добавлен!✅')
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

        let [date, time] = ctx.text.substring(9).split(', ')

        date = removeSpaces(date)
        time = removeSpaces(time)

        if (date && time) {

            const response = await db.deleteWalking(date, time)
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
        let [date, time, newTime, price, guideNames, comment] = ctx.text.substring(10).split(', ')
        let error = false

        date = removeSpaces(date)
        time = removeSpaces(time)
        newTime = removeSpaces(newTime)
        price = removeSpaces(price)
        guideNames = guideNames.split(' ')
            .map(guideName => guideName = removeSpaces(guideName))
            .filter(guideName => guideName != '')

        const guidesId = []
        for (let i = 0; i < guideNames.length; i++) {
            const id = getUsersIdByName(guideNames[i])
            id == 0 ? error = true : ''
            guidesId.push(id)
        }

        if (date && time && newTime && price && guideNames && guidesId && !isNaN(+price) && !error) {
            const response = await db.changeWalking(date, time, newTime, price, guideNames, comment, guidesId)

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

bot.onText('Конверт', async (ctx) => {
    const [chatId, userName, userId] = getMessageInfo(ctx)
    const user = await db.getUsersById(userId)
    const isAdmin = user.isAdmin
    let moneyText = ''


    if(isAdmin) {
        bot.sendMessage(chatId, "Введите имя гида, чей конверт хотите посмотреть", keyboards.moneyAdminKeyboard)
        bot.on('message', async(ctx) => {
            const text = ctx.text
            const guideId = getUsersIdByName(text)
            if(!guideId) {
                bot.sendMessage(chatId, 'Вы ввели имя неправильно!', keyboards.startAdminKeyboard)
            } else {
                const guideConvert = await db.getConvertByGuideId(guideId)
                guideConvert.forEach((note, index) => moneyText += `\n${index + 1}) ${note.text}`)
                bot.sendMessage(chatId, `У ${text} в конверте:\n${moneyText ? moneyText : 'Пусто'}`, keyboards.startAdminKeyboard)
            }
            bot.removeListener('message')
        })
        return
    }


    const convert = await db.getConvertByGuideId(userId)
    convert.forEach((note, index) => moneyText += `\n${index + 1}) ${note.text}`)
    if(moneyText) {
        bot.sendMessage(chatId, `Это записи в вашем конверте 🎄📋✨:\n${moneyText}`, keyboards.moneyGuideKeyboard)
    } else {
        bot.sendMessage(chatId, `В вашем конверте пока пусто 🎅📭✨`, keyboards.moneyGuideKeyboard)
    }
})

bot.onText('Список', async(ctx) => {
    const [chatId, userName, userId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Введите дату спектакля, на который хотите добавить заметку (dd.mm.yy)')

    bot.on('message', async(ctx) => {
        const date = removeSpaces(ctx.text)

        bot.sendMessage(chatId, 'Введите время этого спектакля (hh:mm)')
        bot.removeListener('message')

        bot.on('message', async(ctx) => {
            const time = removeSpaces(ctx.text)
            
            if(date && time) {
                bot.sendMessage(chatId, 'Введите новую заметку')
                bot.removeListener('message')
                
                bot.on('message', async(ctx) => {
                    const newNote = `\n\n${ctx.text}`
                    const comment = await db.updateComment(date, time, newNote)
                    if(comment == 0) {
                        bot.sendMessage(chatId, 'Произошла ошибка при добавлении заметки', keyboards.startAdminKeyboard)
                    } else {
                        bot.sendMessage(chatId, `Успешно! на данный момент список на ${date} ${time} выглядит так:\n\n${comment}`, keyboards.startAdminKeyboard)
                    }
                    bot.removeListener('message')
                })
            }
        })
    })
})

bot.onText('Завершить', async(ctx) => {
    const [chatId, userName, userId] = getMessageInfo(ctx)
    bot.sendMessage(chatId, 'Введите дату спектакля, который хотите завершить (dd.mm.yy)')

    bot.on('message', async(ctx) => {
        const date = removeSpaces(ctx.text)

        bot.sendMessage(chatId, 'Введите время этого спектакля (hh:mm)')
        bot.removeListener('message')

        bot.on('message', async(ctx) => {
            const time = removeSpaces(ctx.text)
            
            if(date && time) {
                const res = await db.completeWalking(date, time)
                if(res == 1) {
                    bot.sendMessage(chatId, 'Выход успешно завершен!', keyboards.startAdminKeyboard)
                }else {
                    bot.sendMessage(chatId, 'Произошла ошибка при завершении выхода!', keyboards.startAdminKeyboard)
                }
                bot.removeListener('message')
            }
        })
    })
})
