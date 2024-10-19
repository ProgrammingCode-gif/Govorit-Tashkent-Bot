const {MongoClient} = require('mongodb')
const {getUsersIdByName} = require('./utils')

class DB {
    constructor(url) {
        this.dbClient = new MongoClient(url)
    }

    async getUsersCollection() {
        try {
            await this.dbClient.connect()
            const collection = this.dbClient.db().collection('users')
            return collection

        } catch(e) {
            console.log('Произошла ошибка при получении колекции Users');
        }
    }

    async getUsers() {
        try {
            const usersCollection = await this.getUsersCollection()
            const users = usersCollection.find().toArray()
            return users

        } catch(e) {
            console.log('Произошла ошибка при получении пользователей', e);
        }
    }

    async getUsersById(id) {
        try {
            const usersCollection = await this.getUsersCollection()
            const user = usersCollection.findOne({guideId: id})
            return user

        } catch (error) {
            console.log('Произошла ошибка при получении пользователя', error);
        }
    }

    async updateUsersMerchStatus(userId, typeOfProduct) {
        try {
            const usersCollection = await this.getUsersCollection()
            const user = await this.getUsersById(userId)

            if(typeOfProduct == 'addStickers') {

                await usersCollection.updateOne({guideId: userId}, {$set:{stickers: +(user.stickers + 1)}})
                return 1;
            }

            if(typeOfProduct == 'addBag') {

                await usersCollection.updateOne({guideId: userId}, {$set:{bags: +(user.bags + 1)}})
                return 1;
            }

            if(typeOfProduct == 'deleteStickers') {
                if(user.stickers == 0) {
                    return 0
                }
                await usersCollection.updateOne({guideId: userId}, {$set:{stickers: +(user.stickers - 1)}})
                return 1;
            }

            if(typeOfProduct == 'deleteBag') {
                if(user.bags == 0) {
                    return 0
                }

                await usersCollection.updateOne({guideId: userId}, {$set:{bags: +(user.bags - 1)}})
                return 1;
            }
            
        } catch (e) {
            console.log('Произошла ошибка при добавлении продукта')
            console.error(e)
        }
    }

    async findAllWalkings() {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            const userWalkings = await walkingsCollection.find().toArray()
            return userWalkings
        } catch (e) {
            console.log('Произошла ошибка при получении всех выходов');
        }
    }

    async findUserWalkings(userId) {
        try {  
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            const userWalkings = await walkingsCollection.find({guideId: userId}).toArray()
            return userWalkings

        } catch (e) {
            console.log('Произошла ошибка при получении выходов пользователя', e);
        }
    }

    async createNewWalking(date, time, price, guideName, comment) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            const guideId = getUsersIdByName(guideName)
            
            if(guideId) {
                walkingsCollection.insertOne({date, time, price, guideName, guideId, comment})
                return 1
            }

            return 0
        } catch (e) {
            console.log('Произошла ошибка при добавлении выхода');
            return 0
        }
    }
    async deleteWalking(date, time, guideName) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            const guideId = getUsersIdByName(guideName)
            await walkingsCollection.deleteOne({date: date, time: time, guideName: guideName, guideId: guideId})
            return 1
        } catch (e) {
            console.log('Произошла ошибка при попытке удаления выхода');
            return 0
        }
    }
    async changeWalking(date, time, newTime, price, guideName, comment) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            const guideId = getUsersIdByName(guideName)
            await walkingsCollection.updateOne({date: date, time: time}, {$set: {time: newTime, price, guideName, comment, guideId}})
            return 1
        } catch (e) {
            console.log('Произошла ошибка при попытке изменить выход');
            return 0
        }
    }
}

module.exports.DB = DB