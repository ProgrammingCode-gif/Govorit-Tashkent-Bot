const keyboards = {
    startAdminKeyboard: {
        reply_markup: JSON.stringify({
            keyboard: [
                [{text: 'Посмотреть выходы'}], 
                [{text: 'Добавить'}, {text: 'Удалить'}, {text: 'Изменить'}], 
                [{text: 'Конверт'}, {text: 'Список'}, {text: "Завершить"}],
        ],
            resize_keyboard: true
        }),
        caption: 'Приветствую босс! 👋\n\nбот проекта «Говорит Ташкент» к вашим услугам!\n\nЧем могу быть полезен ?'
    },
    startGuideKeyboard: {
        reply_markup: JSON.stringify({
            keyboard: [
                [{text: 'Посмотреть выходы'}], 
                [{text: 'Мерч'}, {text: 'Конверт'}]
            ],
            resize_keyboard: true
        }),
        caption: 'Привет! 👋\n\nДеятельность этого бота направлена на помощь гидам проекта «Говорит Ташкент».\n\nЧем могу быть полезен ?'
    },
    merchGuideKeyboard: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '-', callback_data: 'deleteBag'}, {text: 'Шопер', callback_data: 'showBags'}, {text: '+', callback_data: 'addBag'}],
                [{text: '-', callback_data: 'deleteStickers'}, {text: 'Стикеры', callback_data: 'showStickers'}, {text: '+', callback_data: 'addStickers'}]
            ]
        })
    },
    moneyGuideKeyboard: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Добавить запись', callback_data: 'addNote'}, {text: 'Удалить запись', callback_data: 'deleteNote'}],
                [{text: 'Очистить список', callback_data: 'cleanNotes'}]
            ],
            resize_keyboard: true
        })
    },
    cancelDeletingConvert: {
        reply_markup: JSON.stringify({
            keyboard: [['❌'], ['✅']],
            resize_keyboard: true
        })
    },
    moneyAdminKeyboard: {
        reply_markup: JSON.stringify({
            keyboard: [
                [{text: "Асель"}, {text: "Шахзод"}],
                [{text: "Кристофер"}, {text: "Хожиакбар"}],
                [{text: "Малик"}, {text: "Шахриер"}],
                [{text: "Амин"}, {text: "Амаль"}],
        ],
            resize_keyboard: true
        })
    }
}

module.exports.keyboards = keyboards
