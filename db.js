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

    async createNewWalking(date, time, price, guideName, comment, guideId) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            
            if(guideId) {
                walkingsCollection.insertOne({date, time, price, guideName, guideId, comment})
                return 1
            }

            return 0;
        } catch (e) {
            console.log('Произошла ошибка при добавлении выхода');
            return 0
        }
    }
    async deleteWalking(date, time) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            await walkingsCollection.deleteOne({date, time})
            return 1
        } catch (e) {
            console.log('Произошла ошибка при попытке удаления выхода');
            return 0
        }
    }
    async changeWalking(date, time, newTime, price, guideName, comment, guideId) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = this.dbClient.db().collection('walkings')
            await walkingsCollection.updateOne({date: date, time: time}, {$set: {time: newTime, price, guideName, comment, guideId}})
            return 1
        } catch (e) {
            console.log('Произошла ошибка при попытке изменить выход');
            return 0
        }
    }
    async getConvertByGuideId(guideId) {
        try {
            await this.dbClient.connect()
            const usersCollection = await this.getUsersCollection()
            const user = await usersCollection.findOne({guideId: guideId})
            const convert = user.convert
            return convert
        } catch (e) {
            console.log('Произошла ошибка при получении конверта');
            return 0;
        }
    }
    async updateConvert(convert, guideId) {
        try {
            await this.dbClient.connect()
            const usersCollection = await this.getUsersCollection()
            usersCollection.updateOne({guideId}, {$set: {convert}})
        } catch (e) {
            console.log('Произошла ошибка при обновлении конверта');
        }
    }
    async updateComment(date, time, newNote) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = await this.dbClient.db().collection('walkings')
            const walking = await walkingsCollection.findOne({date, time})
            await walkingsCollection.updateOne({date, time}, {$set: {comment: walking.comment + newNote}})
            return walking.comment + newNote
        } catch (error) {
            console.log('Ошибка при получении выхода');
            return 0;
        }
    }
    async completeWalking(date, time) {
        try {
            await this.dbClient.connect()
            const walkingsCollection = await this.dbClient.db().collection('walkings')
            const walking = await walkingsCollection.findOneAndUpdate({date, time}, {$set: {comment: '✅'}})
            if(walking) {
                return 1
            } else {
                return 0
            }
        } catch (error) {
            console.log('Ошибка при получении выхода');
            return 0
        }
    }
}

module.exports.DB = DB