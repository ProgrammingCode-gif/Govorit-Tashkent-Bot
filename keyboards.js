const keyboards = {
    startAdminKeyboard: {
        reply_markup: JSON.stringify({
            keyboard: [['Посмотреть выходы'], ['Добавить выход'], ['Удалить выход'], ['Редактировать выход']],
            resize_keyboard: true
        }),
        caption: 'Приветствую босс! 👋\n\nбот проекта «Говорит Ташкент» к вашим услугам!\n\nЧем могу быть полезен ?'
    },
    startGuideKeyboard: {
        reply_markup: JSON.stringify({
            keyboard: [['Посмотреть выходы'], ['Мерч']],
            resize_keyboard: true
        }),
        caption: 'Привет! 👋\n\nДеятельность этого бота направлена на помощь гидам проекта «Говорит Ташкент»\n\nЧем могу быть полезен ?'
    },
    merchGuideKeyboard: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '-', callback_data: 'deleteBag'}, {text: 'Шопер', callback_data: 'showBags'}, {text: '+', callback_data: 'addBag'}],
                [{text: '-', callback_data: 'deleteStickers'}, {text: 'Стикеры', callback_data: 'showStickers'}, {text: '+', callback_data: 'addStickers'}]
            ]
        })
    }
}

module.exports.keyboards = keyboards