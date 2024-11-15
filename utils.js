function getMessageInfo(ctx) {
    const [chatId, userName, userId] = [ctx.chat.id, ctx.from.first_name, ctx.from.id]

    return [chatId, userName, userId]
}

function getQueryInfo(ctx) {
    const [chatId, userName, userId, data] = [ctx.message.chat.id, ctx.message.chat.first_name, ctx.message.chat.id, ctx.data]

    return [chatId, userName, userId, data]
}

function getUsersIdByName(userName) {
    const users = {
        "Шахзод": 253457862,
        "Тимур": 788380113,
        "Мухаммад": 431400897,
        "Малик": 1931761845,
        "Анастасия": 331802916,
        "Жохангир": 593620442,
        "Хожиакбар": 746546142,
        "Тамила": 113386977,
        "Кристофер": 1419261914,
        "Шестерка": 7250007957
    }

    if(users[userName]) {
        return users[userName]
    }

    return 0
}

function sortDates(arr) {
    return arr.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.').map(Number);
        const [dayB, monthB, yearB] = b.date.split('.').map(Number);
        
        // Convert to Date object (using full year format for comparison)
        const dateA = new Date(2000 + yearA, monthA - 1, dayA); // month is 0-indexed
        const dateB = new Date(2000 + yearB, monthB - 1, dayB);
        
        return dateA - dateB;
    });
}

function splitMessage(message, maxLength = 4000) {
    // Check if the message length exceeds the maxLength
    if (message.length <= maxLength) {
        return [message]; // Return the original message as an array if it's short enough
    }

    // Split the message into chunks of maxLength
    const chunks = [];
    for (let i = 0; i < message.length; i += maxLength) {
        chunks.push(message.slice(i, i + maxLength));
    }

    return chunks;
}

function removeSpaces(sentence) {
    return sentence.replace(/\s+/g, '');
}

function generateUniqueId() {
    // Get the current timestamp
    const timestamp = Date.now();
    
    // Generate a random number between 0 and 9999
    const randomNum = Math.floor(Math.random() * 10000);
    
    // Combine timestamp and random number to form a unique ID
    const uniqueId = timestamp * 10000 + randomNum;
    
    return uniqueId;
  }
  

module.exports.getMessageInfo = getMessageInfo
module.exports.getQueryInfo = getQueryInfo
module.exports.getUsersIdByName = getUsersIdByName
module.exports.sortDates = sortDates
module.exports.splitMessage = splitMessage
module.exports.removeSpaces = removeSpaces
module.exports.generateUniqueId = generateUniqueId