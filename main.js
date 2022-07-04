const { Telegraf, session, Extra, Markup, Scenes } = require('telegraf');
const { BaseScene, Stage } = Scenes
const { enter, leave } = Stage
const stage = new Stage()
const rateLimit = require('telegraf-ratelimit');
const mongo = require('mongodb').MongoClient;
const axios = require('axios')
const { token , admins , curr , keyb } = require('./details')
const mongo_url = "mongodb+srv://bot_v2:bot_v2@cluster0.kzreu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const bot = new Telegraf(token);

//Scenes Register 

const getwallet = new BaseScene('getwallet')
stage.register(getwallet)
const onwith = new BaseScene('onwith')
stage.register(onwith)
const mini = new BaseScene('mini')
stage.register(mini)
const max = new BaseScene('max')
stage.register(max)
const tax = new BaseScene('tax')
stage.register(tax)
const mkey = new BaseScene('mkey')
stage.register(mkey)
const mid = new BaseScene('mid')
stage.register(mid)
const subid = new BaseScene('subid')
stage.register(subid)
const comment = new BaseScene('comment')
stage.register(comment)
const addcha = new BaseScene('addcha')
stage.register(addcha)
const rcha = new BaseScene('rcha')
stage.register(rcha)
const getref = new BaseScene('getref')
stage.register(getref)
const chabal = new BaseScene('chabal')
stage.register(chabal)
const getdetails = new BaseScene('getdetails')
stage.register(getdetails)
const paycha = new BaseScene('paycha')
stage.register(paycha)
const broad = new BaseScene('broad')
stage.register(broad)

bot.catch(error => {
    console.log(error)
})

function senderr(e){
    try{
        for (const i of admins){
            bot.telegram.sendMessage(i,"*AnError Happened ☹️ : "+e+"*",{parse_mode:'Markdown'})
        }
    }catch(err){
        console.log(err)
    }
}
const buttonsLimit = {

    window: 10000,

    limit: 1,

    onLimitExceeded: (ctx, next) => {

      if ('callback_query' in ctx.update)

      ctx.answerCbQuery('❗️ WTF ! You`ve Pressed Buttons Too Often,', true)

        .catch((err) => sendError(err, ctx))

    },

    keyGenerator: (ctx) => {

      return ctx.callbackQuery ? true : false

    }

  }

  bot.use(rateLimit(buttonsLimit))
bot.use(session())
bot.use(stage.middleware())

let db;

mongo.connect(mongo_url, { useUnifiedTopology: true } , (err,client) =>{
    if (err) {
        console.log(err)
    }
    db = client.db(token.split(':')[0]);
    bot.launch().then(console.log(' Bot Hosted On Server Try To Send /start')
    )
})
//Just Main Menu Keyboard
let mainkey = [
    ['📔 Account'],
    ['👫 Invite','🗂️ Wallet'],

    ['💵 Withdraw','📈 Status']
]

const botstart = async (ctx) =>{
    try{
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if (!(admin.length)){
            let botData = {admin:'admin',ref:0,mini:2,max:2,paycha:'@OP_PAYMENTS',botstat:'Active',withstat:'On',subid:'NOT SET',mid:'NOT SET',mkey:'NOT SET',comment:'FROM "+ctx.botInfo.username+"',tax:0,channels:[]}
            db.collection('admin').insertOne(botData)
            ctx.deleteMessage()
            ctx.replyWithMarkdown("*✅ Bot Have Been Ready /start Again 🙂*")
            return
        }
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let uData = await db.collection('info').find({user:ctx.from.id}).toArray()
        if (!(uData.length)){
            db.collection('withdraw').insertOne({user:ctx.from.id,'toWith':0})
            db.collection('info').insertOne({user:ctx.from.id})
            let ref = ctx.startPayload * 1
            let rData = await db.collection('refer').find({user:ctx.from.id}).toArray()
            if((ref) && ctx.from.id != ref && !('invited' in rData) && !(isNaN(ref))){
                db.collection('refer').insertOne({user:ctx.from.id,'invited':ref})
            }else{
                db.collection('refer').insertOne({user:ctx.from.id,'invited':"None",'kid':true})
            }
        }
        let text = "*❗️Please Verify Yourself By Sharing Your Contact* \n\n`✔️ This Is To Verify That You Are An Indian User. `"
        
        bot.telegram.sendMessage(ctx.from.id,text,{parse_mode:'Markdown',reply_markup:{keyboard:[[{text:"☑️ Verify Myself",request_contact:true}]],resize_keyboard: true}})
    }catch(e){
        console.log(e)
senderr(e)
    }
}
bot.start(botstart)


bot.on('contact',async (ctx) =>{
    try{
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        var cont = ctx.update.message.contact.phone_number
    if (ctx.update.message.forward_from){
      bot.telegram.sendMessage(ctx.from.id,"*⚠️ Verification Failed Try Again*",{parse_mode:"markdown"})
      return
    }
    if(!(ctx.update.message.contact.first_name == ctx.from.first_name)){
        ctx.replyWithMarkdown("*⚠️ Verification Failed Try Again*")
        return
    }
      if(!(ctx.message.reply_to_message)){
        ctx.replyWithMarkdown("*⚠️ Verification Failed Try Again*")
        return
    }
    if(cont.startsWith("91") || cont.startsWith("+91")){
        db.collection('info').updateOne({user:ctx.from.id},{$set:{verified:true}})
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let checkJoined = await joinCheck(ctx.from.id,admin)
        if(!checkJoined){
            sendJoined(ctx,admin)
            return
        }
        let uData = await db.collection('refer').find({user:ctx.from.id}).toArray()
        if (!('kid' in uData[0]) && ('invited' in uData[0])){
            await db.collection('refer').updateOne({user:ctx.from.id},{$set:{'kid':true}})
            let refid = uData[0].invited
            let rData = await db.collection('info').find({user:refid}).toArray()
            if(!(rData.length)){
                db.collection('refer').updateOne({user:ctx.from.id},{$set:{'invited':'None'}})
                ctx.replyWithMarkdown("*ℹ️ You Have Clicked A Wrong Invite Link , Please /start again*")
                return
            }
            if (!('balance' in rData[0])){
                var bal = 0;
            }else{
                var bal = rData[0].balance
            }
            let PerRef = admin[0].ref
            let final = parseFloat(bal) + parseFloat(PerRef)
            db.collection('info').updateOne({user:refid},{$set:{'balance':final}})
            ctx.replyWithMarkdown("*ℹ️ You Are Invited By* ["+refid+"](tg://user?id="+refid+")")
            bot.telegram.sendMessage(refid,"*➕ New User On Your Invite Link , You Earned "+admin[0].ref.toFixed(2)+" "+curr+"*",{parse_mode:'Markdown'})
        }
        starter(ctx)
    }
    }catch(e){
        console.log(e)
senderr(e)
    }
})

//Joined Button Code
bot.hears('✅ Joined', async (ctx)=>{
    try{
        if(ctx.message.chat.type != 'private'){
            return
        }
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let checkJoined = await joinCheck(ctx.from.id,admin)
        if(!checkJoined){
            sendJoined(ctx,admin)
            return
        }
        let data = await db.collection('info').find({user:ctx.from.id}).toArray()

        if (!('verified' in data[0])){

            botstart(ctx)

            return

        }
        let uData = await db.collection('refer').find({user:ctx.from.id}).toArray()
        if (!('kid' in uData[0]) && ('invited' in uData[0])){
            await db.collection('refer').updateOne({user:ctx.from.id},{$set:{'kid':true}})
            let refid = uData[0].invited
            let rData = await db.collection('info').find({user:refid}).toArray()
            if(!(rData.length)){
                db.collection('refer').updateOne({user:ctx.from.id},{$set:{'invited':'None'}})
                ctx.replyWithMarkdown("*ℹ️ You Have Clicked A Wrong Invite Link , Please /start again*")
                return
            }
            if (!('balance' in rData[0])){
                var bal = 0;
            }else{
                var bal = rData[0].balance
            }
            let PerRef = admin[0].ref
            let final = parseFloat(bal) + parseFloat(PerRef)
            db.collection('info').updateOne({user:refid},{$set:{'balance':final}})
            
       

                   
            

           

   

        



    


            ctx.replyWithMarkdown("*ℹ️ You Are Invited By* ["+refid+"](tg://user?id="+refid+")")
            bot.telegram.sendMessage(refid,"*➕ New User On Your Invite Link , You Earned "+admin[0].ref.toFixed(2)+" "+curr+"*",{parse_mode:'Markdown'})
        }
        starter(ctx)
    }catch(e){
        console.log(e)
senderr(e)

    }
})

//Account Info Button Code
bot.hears('📔 Account' , async (ctx) =>{
    try{
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let data = await db.collection('info').find({user:ctx.from.id}).toArray()
        if (!('verified' in data[0])){
            botstart(ctx)
            return
        }
        let checkJoin = await joinCheck(ctx.from.id,admin)
        if(!checkJoin){
            sendJoined(ctx,admin)
            return
        }
        if (!('balance' in data[0])){
            var bal =0;
        }else{
            var bal = data[0].balance
        }
        if (!('wallet' in data[0])){
            var wallet = 'None'
        }else{
            var wallet = data[0].wallet
        }
        
        const { token , admins , curr , keyb } = require('./details')
        let text = "*🧑‍💻 Account Information\n\n🚹 Account Name :* `"+ctx.from.first_name+"`\n*📤 Available Balance For Withdrawal :* `"+bal.toFixed(2)+"` *"+curr+"*"
        

ctx.replyWithMarkdown(text,{reply_markup:{keyboard:keyb, resize_keyboard: true }})
       
}catch(e){

        console.log(e)

senderr(e)

    }

})
        



    








    
        



    



//Invite Button Code
bot.hears('👫 Invite', async (ctx)=>{
    try{
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let data = await db.collection('info').find({user:ctx.from.id}).toArray()
        if (!('verified' in data[0])){
            botstart(ctx)
            return
        }
        let checkJoin = await joinCheck(ctx.from.id,admin)
        if(!checkJoin){
            sendJoined(ctx,admin)
            return
        }
        
        const { token , admins , curr , keyb } = require('./details')
        let text = "*👫 Invite System For* ["+ctx.from.first_name+"](tg://user?id="+ctx.from.id+")\n\n*⛓ Invite Link : https://t.me/"+bot.botInfo.username+"?start="+ctx.from.id+"\n\n💵 Invite & Earn "+admin[0].ref.toFixed(2)+" "+curr+" *"
        ctx.replyWithMarkdown(text,{reply_markup:{keyboard:keyb, resize_keyboard: true }})


    }catch(e){
        console.log(e)
senderr(e)
    }
})

bot.hears('📈 Status',async (ctx) =>{
    try{
        //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let data = await db.collection('info').find({user:ctx.from.id}).toArray()
        if (!('verified' in data[0])){
            botstart(ctx)
            return
        }
        let checkJoin = await joinCheck(ctx.from.id,admin)
        if(!checkJoin){
            sendJoined(ctx,admin)
            return
        }
        let users = await db.collection('info').find({},{projection:{user:1,'_id':0}}).toArray()
        let payout = await db.collection('admin').find({Payout:'Payout'}).toArray()
        if(payout.length == 0){
            var final = 0;
        }else{
            var final = payout[0].value
        }
        //
        
        const { token , admins , curr , keyb } = require('./details')
        let text = "*📈 Bot Status\n\n💡 Total Users : "+users.length+"\n\n📤 Total Withdrawn : "+final.toFixed(2)+" "+curr+"\n\n✅ Bot Created By* [CODER_OP](tg://user?id=1635788715)"
        ctx.replyWithMarkdown(text,{reply_markup:{keyboard:keyb, resize_keyboard: true }})


    }catch(e){
        senderr(e)
        console.log(e)
    }
})

//Wallet Button Code
bot.hears('🗂️ Wallet', async (ctx) =>{
    try{
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(ctx.message.chat.type != 'private'){
            return
        }
        let botstat = admin[0].botstat
        if (botstat != 'Active'){
            ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
            return
        }
        let data = await db.collection('info').find({user:ctx.from.id}).toArray()
        if (!('verified' in data[0])){
            botstart(ctx)
            return
        }
        let checkJoin = await joinCheck(ctx.from.id,admin)
        if(!checkJoin){
            sendJoined(ctx,admin)
            return
        }
        
        ctx.replyWithMarkdown("*📝 Enter Your "+curr+" Wallet Address Below And It Will Be Saved For All Future Withdrawals.*\n\n\n`You Can Still Change Your Wallet Address Later On.`",{reply_markup:{keyboard:[
            ['🚫 Cancel']
        ],resize_keyboard:true}})
        await ctx.scene.enter('getwallet')
    }catch(e){
        senderr(e)
        console.log(e)
    }
})

//Set Wallet Scene
getwallet.on('text', async (ctx) =>{
    try{
        const name = 'getwallet'
        if (ctx.message.text == '🚫 Cancel'){
            
            starter(ctx)
            await ctx.scene.leave(name)
            return
        }else if(isNaN(ctx.message.text)){
            ctx.replyWithMarkdown("*❗️ Error : This Is Not A "+curr+" Wallet Address ! *",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        }else if(ctx.message.text.length != 10){
            ctx.replyWithMarkdown("*❗️ Error : This Is Not A "+curr+" Wallet Address ! *",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        }else{
            db.collection('info').updateOne({user:ctx.from.id},{$set:{'wallet':ctx.message.text}})
            ctx.replyWithMarkdown("*✔️ Done Your New "+curr+" Wallet Adress Is* : `"+ctx.message.text+"`",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
        }
    }catch(e){
        senderr(e)
        console.log(e)
    }
})

//Withdraw Button Code
bot.hears('💵 Withdraw',async (ctx) =>{
    try{
    //bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => console.log(err))
    let admin = await db.collection('admin').find({admin:'admin'}).toArray()
    if(ctx.message.chat.type != 'private'){
        return
    }
    let botstat = admin[0].botstat
    if (botstat != 'Active'){
        ctx.replyWithMarkdown('*🚫 Bot Is Under Maintenance*')
        return
    }
    let withstat = admin[0].withstat
    if(withstat != 'On'){
        ctx.replyWithMarkdown('*🚫 Withdrawal Is Under Maintenance*')
        return
    }
    let data = await db.collection('info').find({user:ctx.from.id}).toArray()
    if (!('verified' in data[0])){
        botstart(ctx)
        return
    }
    let checkJoin = await joinCheck(ctx.from.id,admin)
    if(!checkJoin){
        sendJoined(ctx,admin)
        return
    }
    if(!('balance' in data[0])){
        var bal = 0;
    }else{
        var bal = data[0].balance
    }
    let mini = admin[0].mini
    if (parseFloat(bal) < parseFloat(mini)){
        ctx.replyWithMarkdown('*❌ You Have To Own At Least '+mini.toFixed(2)+' '+curr+' In Your Account To Withdraw.*')
        return
    }
    if(!('wallet' in data[0])){
        const { token , admins , curr} = require('./details')
        ctx.replyWithMarkdown('*❗️ Please Set Your Wallet Adress Before Withdraw *')
        return
    }
    ctx.replyWithMarkdown("*📤 Enter The Amount To Transfer To Your Wallet*",{reply_markup:{keyboard:[
        ['🚫 Cancel']
    ],resize_keyboard:true}})
    await ctx.scene.enter('onwith')
    }catch(e){
        senderr(e)
        console.log(e)
    }
})

onwith.on('text',async (ctx) =>{
    try{
        const name = 'onwith'
        var admin = await db.collection('admin').find({admin:'admin'}).toArray()
        var data = await db.collection('info').find({user:ctx.from.id}).toArray()
        let mini = admin[0].mini
        if (ctx.message.text == '🚫 Cancel'){
            starter(ctx)
            await ctx.scene.leave(name)
            return
        }else if(isNaN(ctx.message.text)){
            ctx.replyWithMarkdown("*⚠️ Transaction Failed Try Again*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        
        }else if(parseFloat(mini) > parseFloat(ctx.message.text)){
            var bal = data[0].balance
            ctx.replyWithMarkdown("*❌ Enter A Value Above* `"+mini+"` *But Not Greater Than* `"+bal.toFixed(2)+"` *"+curr+"* ",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        }else if(parseFloat(ctx.message.text) > parseFloat(data[0].balance)){
            var bal = data[0].balance
            ctx.replyWithMarkdown("*❌ Enter A Value Above* `"+mini+"` *But Not Greater Than* `"+bal.toFixed(2)+"` *"+curr+"*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        }else if(parseFloat(ctx.message.text) > parseFloat(admin[0].max)){
            ctx.replyWithMarkdown("*🚫 The Transaction Amount Should Not Be Above* `"+admin[0].max+"` *"+curr+"*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        } else if (ctx.message.forward_from){
            ctx.replyWithMarkdown("*⚠️ Transaction Failed Try Again*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            await ctx.scene.leave(name)
            return
        } else{
            await ctx.scene.leave(name)
            await db.collection('withdraw').updateOne({user:ctx.from.id},{$set:{'toWith':parseFloat(ctx.message.text)}})
            let text = "*❗️ Transaction Confirmation\n\n💰 Transfer Amount "+ctx.message.text+" "+curr+" To The Wallet* `"+data[0].wallet+"`*\n\n✔️ Click '✅ Confirm' To Continue Transaction*"
            ctx.replyWithMarkdown(text,{reply_markup:{inline_keyboard:[
                [{text:'✅ Confirm',callback_data:'continue'},{text:'⛔️ Cancel',callback_data:'reject'}]
            ]}})            
        }
    }catch(e){
        senderr(e)
        console.log(e)
    }
})

bot.action('reject', async (ctx) =>{
    try{
        await db.collection('withdraw').updateOne({user:ctx.from.id},{$set:{'toWith':0}})
        await ctx.deleteMessage()
        ctx.replyWithMarkdown("*🚫 Transaction Cancelled By User*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
    }catch(e){
        console.log(e)
        senderr(e)
    }
})

bot.action('continue',async (ctx) =>{
    try{
        await ctx.deleteMessage()  
        let wData = await db.collection('withdraw').find({user:ctx.from.id}).toArray()
        await db.collection('withdraw').updateOne({user:ctx.from.id},{$set:{'toWith':0}})      
        var toWith = wData[0].toWith * 1
        if(toWith == 0){            
            ctx.replyWithMarkdown("*⚠️ Transaction Failed Try Again*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            return
        }
        let uData = await db.collection('info').find({user:ctx.from.id}).toArray()
        var bal = uData[0].balance * 1
        if(bal < toWith){
            ctx.replyWithMarkdown("*⚠️ Transaction Failed Try Again*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            return
        }
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let tax = admin[0].tax * 1 
        let finalamo = (toWith/100) * tax
        let amo =  parseFloat(toWith - finalamo)
        let swg = admin[0].subid
        let mkey = admin[0].mkey 
        let mid = admin[0].mid 
        let comment = admin[0].comment 
        let wallet = uData[0].wallet
        var finalBal = parseFloat(bal) - parseFloat(toWith)
        db.collection('info').updateOne({user:ctx.from.id},{$set:{'balance':finalBal}})
       
        var url = 'https://job2all.xyz/api/index.php?mid='+mid+'&mkey='+mkey+'&guid='+swg+'&mob='+wallet+'&amount='+amo.toString()+'&info='+comment;
        
        var text = "*💵 Transaction Successful\n\n💰 The Amount Of "+toWith+" "+curr+" With A Fee Of %"+tax+" Have Been Sented To Your Wallet *`"+wallet+"` *Successfully*"
        var payText = "*✔️ New Transaction Successfully Paid To "+curr+" Wallet\n🤖 Bot Link - @"+ctx.botInfo.username+"\n\n🚹 User* - ["+ctx.from.id+"](tg://user?id="+ctx.from.id+")\n\n*💵 Transaction Details :- The Amount Of "+toWith+" "+curr+" With A Fee Of  %"+tax+" Have Successfully Sent To* `"+wallet+"`"
        ctx.replyWithMarkdown(text,{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        var res = await axios.post(url)
        bot.telegram.sendMessage(admin[0].paycha,payText,{parse_mode:'Markdown'}).catch(e => console.log(e.response.description))
       
        let pData = await db.collection('admin').find({Payout:'Payout'}).toArray()
        if(!pData.length){
            var TPay = 0;
            db.collection('admin').insertOne({Payout:'Payout',value:TPay})
        }else{
            var TPay = pData[0].value
        }
        var finalPay = parseFloat(toWith) + parseFloat(TPay)
        db.collection('admin').updateOne({Payout:'Payout'},{$set:{value:finalPay}})


    }catch(e){

    }
})




    





//Minimum Withdraw Scene
mini.on('text', async (ctx) =>{
    try{
        const name = 'mini'
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let tax = admin[0].tax
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        } else if (isNaN(ctx.message.text)){
            ctx.replyWithMarkdown(
                '*⛔ Enter A Valid Amount*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
            )
        
        }else{
            let finalamo = (parseFloat(ctx.message.text)/100) * tax
            let amo =  parseFloat(parseFloat(ctx.message.text) - finalamo)
            if(amo < 1){
                ctx.replyWithMarkdown(
                    '*🚫 Minimum Withdraw Should Be Above 1*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
                )
                
            }else{
                db.collection('admin').updateOne({admin:'admin'},{$set:{mini: parseFloat(ctx.message.text)}})
            ctx.replyWithMarkdown(
                '*✅ Minimum Withdraw Updated To '+ctx.message.text+'*', { reply_markup: { keyboard: mainkey, resize_keyboard: true } }
            )
            }
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Maximum Withraw Scene
max.on('text', async (ctx) =>{
    try{
        const name = 'max'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        } else if (isNaN(ctx.message.text)){
            ctx.replyWithMarkdown(
                '*⛔ Enter A Valid Amount*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
            )
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{max: parseFloat(ctx.message.text)}})
            ctx.replyWithMarkdown(
                '*✅ Maximum Withdraw Updated To '+ctx.message.text+'*', { reply_markup: { keyboard: mainkey, resize_keyboard: true } }
            )
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Refer Bonus Scene
getref.on('text', async (ctx) =>{
    try{
        const name = 'getref'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        } else if (isNaN(ctx.message.text)){
            ctx.replyWithMarkdown(
                '*⛔ Enter A Valid Amount*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
            )
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{ref: parseFloat(ctx.message.text)}})
            ctx.replyWithMarkdown(
                '*✅ Refer Bonus Updated To '+ctx.message.text+'*', { reply_markup: { keyboard: mainkey, resize_keyboard: true } }
            )
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})


//Tax Withdraw Scene
tax.on('text', async (ctx) =>{
    try{
        const name = 'tax'
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        const mini = admin[0].mini
        const tax = parseFloat(ctx.message.text)
        let finalamo = (mini/100) * tax
        let amo =  parseFloat(mini - finalamo)
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        } else if (isNaN(ctx.message.text)){
            ctx.replyWithMarkdown(
                '*⛔ Enter A Valid Amount*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
            )
        }else if(amo < 2){
            ctx.replyWithMarkdown(
                '*🚫 Please Set Minimum Withdraw To 2 Or Above*', { reply_markup: { keyboard:mainkey, resize_keyboard: true } }
            )
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{tax: ctx.message.text}})
            ctx.replyWithMarkdown(
                '*✅ Withdraw Fee Updated To '+ctx.message.text+'%*', { reply_markup: { keyboard: mainkey, resize_keyboard: true } }
            )
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Subwallet id Scene
subid.on('text',async (ctx)=>{
    try{
        const name = 'subid'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{subid:ctx.message.text}})
            ctx.replyWithMarkdown("*✅ Subwallet Id Updated To *`"+ctx.message.text+"`", { reply_markup: { keyboard: mainkey, resize_keyboard: true } })
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Merchant id Scene
mid.on('text',async (ctx)=>{
    try{
        const name = 'mid'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{mid:ctx.message.text}})
            ctx.replyWithMarkdown("*✅ Merchant Id Updated To *`"+ctx.message.text+"`", { reply_markup: { keyboard: mainkey, resize_keyboard: true } })
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Merchant Key Scene
mkey.on('text',async (ctx)=>{
    try{
        const name = 'mid'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{mkey:ctx.message.text}})
            ctx.replyWithMarkdown("*✅ Merchant Key Updated To *`"+ctx.message.text+"`", { reply_markup: { keyboard: mainkey, resize_keyboard: true } })
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Pay Comment Scene
comment.on('text',async (ctx)=>{
    try{
        const name = 'comment'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{comment:ctx.message.text}})
            ctx.replyWithMarkdown("*✅ Comment Updated To *`"+ctx.message.text+"`", { reply_markup: { keyboard: mainkey, resize_keyboard: true } })
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Payment Channel Scene
paycha.on('text',async (ctx) =>{
    try{
        const name = 'paycha'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else if(ctx.message.text.split('')[0] != '@'){
            ctx.replyWithMarkdown("*⛔ Channel Username Must Start With @*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else{
            db.collection('admin').updateOne({admin:'admin'},{$set:{paycha:ctx.message.text}})
            ctx.replyWithMarkdown("*✅ Payment Channel Updated To "+ctx.message.text+"*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Add Channel Scene
addcha.on('text',async (ctx) =>{
    try{
        const name = 'addcha'
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else if(ctx.message.text.split('')[0] != '@'){
            ctx.replyWithMarkdown("*⛔ Channel Username Must Start With @*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else{
            let admin = await db.collection('admin').find({admin:'admin'}).toArray()
            let oldCha = admin[0].channels
            oldCha.push(ctx.message.text)
            db.collection('admin').updateOne({admin:'admin'},{$set:{channels:oldCha}})
            ctx.replyWithMarkdown("*✅ "+ctx.message.text+" Added To Our Database*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Remove Channel Scene
rcha.on('text',async (ctx) =>{
    try{
        const name = 'rcha'
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let oldCha = admin[0].channels
        if (ctx.message.text == '🚫 Cancel') {
            starter(ctx)
        }else if(ctx.message.text.split('')[0] != '@'){
            ctx.replyWithMarkdown("*⛔ Channel Username Must Start With @*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else if(!(contains(ctx.message.text,oldCha))){
            ctx.replyWithMarkdown("*⛔ Channel Not Found In Database*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else{
            let newCha = await arrayRemove(oldCha,ctx.message.text)
            db.collection('admin').updateOne({admin:'admin'},{$set:{channels:newCha}})
            ctx.replyWithMarkdown("*✅ "+ctx.message.text+" Removed From Our Database*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }
        await ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//Change Balance Scene
chabal.on('text',async (ctx)=>{
    try{
        const name = 'chabal'
        const msg = ctx.message.text
        var id = msg.split(' ')[0]
        var amo2 = msg.split(' ')[1]
        if (msg == '🚫 Cancel') {
            starter(ctx)
        }else if(id == undefined || amo2 == undefined){
            ctx.replyWithMarkdown("*⚠️ Please Provide Telegram Id Or Amount*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else if(isNaN(id) || isNaN(amo2)){
            ctx.replyWithMarkdown("*🚫 Not Valid Amount Or Telegram id*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
        }else{
            var amo = parseFloat(amo2);
            var id2 = parseInt(id)
            let data = await db.collection('info').find({user:id2}).toArray()
            if(!(data.length)){
                ctx.replyWithMarkdown("*⛔ User Not Found In Our Database*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            }else{
                if(!('balance' in data[0])){
                    var bal = 0;
                }else{
                    var bal = data[0].balance
                }
                var final = parseFloat(bal) + amo
                db.collection('info').updateOne({user:id2},{$set:{'balance':final}})
                bot.telegram.sendMessage(id2,"*✅ Your Balance Was Changed To "+final.toFixed(2)+" "+curr+" By Admin *",{parse_mode:"Markdown"})
                ctx.replyWithMarkdown("*✅ Balance Updated Final Balance :* '"+final+"' *"+curr+"*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            }
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

//User Details Scene
getdetails.on('text',async (ctx) =>{
    try{
        const name = 'getdetails'
        const msg = ctx.message.text
        if (msg == '🚫 Cancel') {
            starter(ctx)
        }else{
            let data = await db.collection('info').find({user:parseInt(ctx.message.text)}).toArray()
            if(!(data.length)){
                ctx.replyWithMarkdown("*⛔ User Not Found In Our Database*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            }else{
                if(!('balance' in data[0])){
                    var bal = 0;
                }else{
                    var bal = data[0].balance
                }
                if(!('wallet' in data[0])){
                    var wallet = 'NOT SET'
                }else{
                    var wallet = data[0].wallet;
                }
                let rData = await db.collection('refer').find({user:parseInt(ctx.message.text)}).toArray()
                var invited = rData[0].invited
                var text = "*🐥 User: *["+ctx.message.text+"](tg://user?id="+ctx.message.text+")\n\n*💰 Balance: "+bal.toFixed(3)+" "+curr+"\n🗂️ Paytm Number: *`"+wallet+"`\n*👫 Invited By: *`"+invited+"`"
                ctx.replyWithMarkdown(text,{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
            }
        }
        ctx.scene.leave(name)
    }catch(e){
        senderr(e)
    }
})

bot.command('adminhelp',async (ctx) =>{
    try{
        if(!(admins.includes(ctx.from.id))){
            ctx.deleteMessage()
            return
        }
        
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let ref = admin[0].ref
        let mini = admin[0].mini
        let max = admin[0].max
        let tax = admin[0].tax
        var data = admin;
        let botstat = admin[0].botstat
    let withstat = admin[0].withstat
    if (botstat == 'Active'){
        var bot_button = "✅"
    }else{
        var bot_button = "☑️"
    }
    if(withstat == 'On'){
        var with_button = "✅"
    }else{
        var with_button = "☑️"
    }
    let mid = admin[0].mid
    let mkey = admin[0].mkey
    let subid = admin[0].subid
    if (mid == 'NOT SET' || mkey == 'NOT SET' || subid == 'Not Set'){
        var key_button = "☑️"
    }else{
        var key_button = "✅"
    }
        
    var inline = [

        [{text:'👫 Invite',callback_data:'change_ref'},{text:'💰 Minimum',callback_data:'change_mini'}],

        [{text:'💰 Maximum',callback_data:'change_max'},{text:'➖ Fee',callback_data:'change_tax'}],

        [{text:'🌲 Change Channels',callback_data:'change_cha'}],

        [{text:'🚹 User Details',callback_data:'get_details'},{text:'🔄 Change Balance',callback_data:'change_balance'}],

        

        [{text:'🤖 Bot : '+bot_button+'',callback_data:'bot_status'},{text:'📤 Withdraw : '+with_button+'',callback_data:'with_status'}],

        [{text:'✏️ Paytm Keys : '+key_button+'',callback_data:'paytm_key'}]

    ]
    let text = "*👋 Hi "+ctx.from.first_name+"\n🤘 Welcome To Admin Panel\n\n💡 Bot Current Status :\n\t\t\t\t👫 Invite : "+ref.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Minimum Withdraw : "+mini.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Maximum Withdraw : "+max.toFixed(2)+" "+curr+"\n\t\t\t\t➖ Fee : "+tax+"%\n\t\t\t\t🤖 Bot Status : "+bot_button+"\n\t\t\t\t📤 Withdrawals : "+with_button+"*"
        ctx.replyWithMarkdown(text,{reply_markup:{inline_keyboard:inline}})
    }catch(e){
        senderr(e)
    }
})

bot.action('change_ref',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown("*💡 Enter New Refer Bonus Amount*",{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('getref')
    }catch(e){
        senderr(e)
    }
})

bot.action('change_mini',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown("*💡 Enter New Minimum Withdraw Amount*",{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('mini')
    }catch(e){
        senderr(e)
    }
})

bot.action('change_max',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown("*💡 Enter New Maximum Withdraw Amount*",{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('max')
    }catch(e){
        senderr(e)
    }
})

bot.action('change_tax',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown("*💡 Enter Withdraw Fee\n\n🙂 Example :* `50` *( This Will Cut 50% Fee , eg; If User Withdraw 2 "+curr+" They Gets 1 "+curr+" )*",{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('tax')
    }catch(e){
        senderr(e)
    }
})

bot.action('change_balance',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown('*💡 Send User Telegram Id & Amount\n\n⚠️ Use Format : *`' + ctx.from.id + ' 100`',{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('chabal')
    }catch(e){
        senderr(e)
    }
})

bot.action('get_details',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown("*💡 Send User Telegram Id *",{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('getdetails')
    }catch(e){
        senderr(e)
    }
})

bot.action('bot_status', async (ctx) =>{
    try{
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        if(admin[0].botstat == 'Active'){
            db.collection('admin').updateOne({admin:'admin'},{$set:{botstat:'Disable'}})
            var bot_button = "☑️"
        }else{
            var bot_button = "✅"
            db.collection('admin').updateOne({admin:'admin'},{$set:{botstat:'Active'}})
        }
        var data = admin;
        let ref = admin[0].ref
        let mini = admin[0].mini
        let max = admin[0].max
        let tax = admin[0].tax
        let withstat = admin[0].withstat
        if(withstat == 'On'){
            var with_button = "✅"
        }else{
            var with_button = "☑️"
        }
        let mid = data[0].mid
        let mkey = data[0].mkey
        let subid = data[0].subid
        if (mid == 'NOT SET' || mkey == 'NOT SET' || subid == 'Not Set'){
            var key_button = "☑️"
        }else{
            var key_button = "✅"
        }
        var inline = [

        [{text:'👫 Invite',callback_data:'change_ref'},{text:'💰 Minimum',callback_data:'change_mini'}],

        [{text:'💰 Maximum',callback_data:'change_max'},{text:'➖ Fee',callback_data:'change_tax'}],

        [{text:'🌲 Change Channels',callback_data:'change_cha'}],

        [{text:'🚹 User Details',callback_data:'get_details'},{text:'🔄 Change Balance',callback_data:'change_balance'}],

        

        [{text:'🤖 Bot : '+bot_button+'',callback_data:'bot_status'},{text:'📤 Withdraw : '+with_button+'',callback_data:'with_status'}],

        [{text:'✏️ Paytm Keys : '+key_button+'',callback_data:'paytm_key'}]

    ]
        let text = "*👋 Hi "+ctx.from.first_name+"\n🤘Welcome To Admin Panel\n\n💡 Bot Current Status :\n\t\t\t\t👫 Invite : "+ref.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Minimum Withdraw : "+mini.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Maximum Withdraw : "+max.toFixed(2)+" "+curr+"\n\t\t\t\t➖ Fee : %"+tax+"\n\t\t\t\t🤖 Bot Status : "+bot_button+"\n\t\t\t\t📤 Withdrawals: "+with_button+"*"
        ctx.editMessageText(text,{reply_markup:{inline_keyboard:inline},parse_mode:'Markdown'})
    }catch(e){
        senderr(e)
    }
})

bot.action('with_status', async (ctx) =>{
    try{
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let botstat = admin[0].botstat
        let withstat = admin[0].withstat
        if(withstat == 'On'){
            db.collection('admin').updateOne({admin:'admin'},{$set:{withstat:'Off'}})
            var with_button = "☑️"
        }else{
            var with_button = "✅"
            db.collection('admin').updateOne({admin:'admin'},{$set:{withstat:'On'}})
        }
        var data = admin;
        let ref = admin[0].ref
        let mini = admin[0].mini
        let max = admin[0].max
        let tax = admin[0].tax        
        if (botstat == 'Active'){
            var bot_button = "✅"
        }else{
            var bot_button = "☑️"
        }
        let mid = data[0].mid
        let mkey = data[0].mkey
        let subid = data[0].subid
        if (mid == 'NOT SET' || mkey == 'NOT SET' || subid == 'Not Set'){
            var key_button = "☑️"
        }else{
            var key_button = "✅"
        }
        var inline = [

        [{text:'👫 Invite',callback_data:'change_ref'},{text:'💰 Minimum',callback_data:'change_mini'}],

        [{text:'💰 Maximum',callback_data:'change_max'},{text:'➖ Fee',callback_data:'change_tax'}],

        [{text:'🌲 Change Channels',callback_data:'change_cha'}],

        [{text:'🚹 User Details',callback_data:'get_details'},{text:'🔄 Change Balance',callback_data:'change_balance'}],

        

        [{text:'🤖 Bot : '+bot_button+'',callback_data:'bot_status'},{text:'📤 Withdraw : '+with_button+'',callback_data:'with_status'}],

        [{text:'✏️ Paytm Keys : '+key_button+'',callback_data:'paytm_key'}]

    ]
        let text = "*👋 Hi "+ctx.from.first_name+"\n🤘Welcome To Admin Panel\n\n💡 Bot Current Status :\n\t\t\t\t👫 Invite : "+ref.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Minimum Withdraw : "+mini.toFixed(2)+" "+curr+"\n\t\t\t\t💰 Maximum Withdraw : "+max.toFixed(2)+" "+curr+"\n\t\t\t\t➖ Fee : %"+tax+"\n\t\t\t\t🤖 Bot Status : "+bot_button+"\n\t\t\t\t📤 Withdrawals : "+with_button+"*"
        ctx.editMessageText(text,{reply_markup:{inline_keyboard:inline},parse_mode:'Markdown'})
    }catch(e){
        senderr(e)
    }
})

bot.action('change_cha',async (ctx) =>{
    try{
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let channel = admin[0].channels
        let text = "*🌲 Currenly Set Channels : \n\n"
        if (!(channel.length)){
            text += "☑️ No Channels"
        }
        for (i in channel){
            let cha = channel[i]
            text += ""+cha+"\n"
        }
        text += "\n\n📤 Payout Channel : "+admin[0].paycha+"*"
        var inline = [
            [{text:'➕ Add Channel',callback_data:"add_cha"},{text:'➖ Remove Channel',callback_data:'r_cha'}],
            [{text:'📤 Payout Channel',callback_data:'pay_cha'}]
        ]
        ctx.editMessageText(text,{reply_markup:{inline_keyboard:inline},parse_mode:'Markdown'})
    }catch(e){
        senderr(e)
    }
})

bot.action('add_cha',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown('*💡 Send Username Of Channel*',{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('addcha')
    }catch(e){
        senderr(e)
    }
})

bot.action('r_cha',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown('*💡 Send Username Of Channel*',{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('rcha')
    }catch(e){
        senderr(e)
    }
})

bot.action('pay_cha',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.replyWithMarkdown('*💡 Send Username Of Channel*',{reply_markup:{keyboard:[['🚫 Cancel']],resize_keyboard:true}})
        ctx.scene.enter('paycha')
    }catch(e){
        senderr(e)
    }
})

bot.action('paytm_key',async (ctx) =>{
    try{
        let admin = await db.collection('admin').find({admin:'admin'}).toArray()
        let text = "*✏️ YOUR PAYTM KEYS : \n\n🗝️ SUBWALLET GUID : *`"+admin[0].subid+"`\n*🗝️ MERCHANT KEY : *`"+admin[0].mkey+"`\n*🗝️ MERCHANT ID : *`"+admin[0].mid+"`\n*💬 PAYMENT COMMENT : *`"+admin[0].comment+"`"
        var inline = [

            [{text:"🔐 SUBWALLET ID",callback_data:'subid'}],

[{text:"🔐 MERCHANT KEY",callback_data:'mkey'},

            {text:"🔐 MERCHANT ID",callback_data:'mid'}],

[{text:"💬 PAYMENT COMMENT",callback_data:'pay_comment'}]

        ]
        ctx.editMessageText(text,{parse_mode:"Markdown",reply_markup:{inline_keyboard:inline}})
    }catch(e){
        senderr(e)
    }
})

bot.action('pay_comment',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.reply(
            '*💡 Send Your Description For Payment*', { parse_mode: 'markdown', reply_markup: { keyboard: [['🚫 Cancel']], resize_keyboard: true } }
        )
        ctx.scene.enter('comment')
    }catch(e){
        senderr(e)
    }
})

bot.action('mid',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.reply(
            '*💡 Send Your Merchant ID*', { parse_mode: 'markdown', reply_markup: { keyboard: [['🚫 Cancel']], resize_keyboard: true } }
        )
        ctx.scene.enter('mid')
    }catch(e){
        senderr(e)
    }
})

bot.action('mkey',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.reply(
            '*💡 Send Your Merchant Key*', { parse_mode: 'markdown', reply_markup: { keyboard: [['🚫 Cancel']], resize_keyboard: true } }
        )
        ctx.scene.enter('mkey')
    }catch(e){
        senderr(e)
    }
})

bot.action('subid',(ctx) =>{
    try{
        ctx.deleteMessage()
        ctx.reply(
            '*💡 Send Your Subwallet Guid*', { parse_mode: 'markdown', reply_markup: { keyboard: [['🚫 Cancel']], resize_keyboard: true } }
        )
        ctx.scene.enter('subid')
    }catch(e){
        senderr(e)
    }
})

broad.on('text',async (ctx) =>{
    let uData = await db.collection('info').find({},{projection:{user:1,'_id':0}}).toArray()
    let msg = ctx.message.text
    if (msg == '🚫 Cancel') {
            starter(ctx)
            ctx.scene.leave('broad')
            return
     }
    let users = await db.collection('info').find({},{projection:{user:1,'_id':0}}).toArray()
    ctx.replyWithMarkdown("*📩 Broadcast Received By "+users.length+" Users*",{reply_markup:{keyboard:mainkey,resize_keyboard:true}})
    for (var i of uData){
       ctx.copyMessage(i.user).catch(e => console.log(e))
    }
    ctx.scene.leave('broad')

})

bot.command('broadcast',async (ctx) =>{
    if(!(admins.includes(ctx.from.id))){
        ctx.deleteMessage()
        return
    }
    
    ctx.reply(
        '*📨 Send Message To Send Broadcast*', { parse_mode: 'markdown', reply_markup: { keyboard: [['🚫 Cancel']], resize_keyboard: true } }
    )
    await ctx.scene.enter('broad')
})

async function starter(ctx){
    var text = "*🍀 Welcome To Dashboard*"
    ctx.replyWithMarkdown(text,{reply_markup:{keyboard:mainkey, resize_keyboard: true }})

}



async function sendJoined(ctx,data){
    try{
        let chnl = data[0].channels
        var final = '';

        for (i in chnl) {

            final += chnl[i] + "\n";

        }
        
        ctx.reply(

            "<b>🔻 You Have To Join This Channels</b>\n\n" + final + "\n<b>🤞 After Joining, Click On '✅ Joined'</b>", { parse_mode: 'html', reply_markup: { keyboard: [['✅ Joined']], resize_keyboard: true } }

        )
    }catch(e){
        console.log(e)
senderr(e)
    }
}

async function joinCheck(userId,data){
    try{
        let isJoined = true;
        let channel = data[0].channels
        for (i in channel){
            let chat = channel[i];
            //Sorry For Galiya
            let Land = await bot.telegram.getChatMember(chat,userId)
            let Loda = Land.status
            if (Loda == 'creator' || Loda == 'administrator' || Loda == 'member'){
                continue
            }else{
                isJoined = false;
                break
            }
        }
        return isJoined
    }catch(e){
        console.log(e)
senderr(e)
        return false
    }
}

function contains(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
       }
   }
   return false;
}

function arrayRemove(arr, value) {
    return arr.filter(function (ele) {
        return ele != value;
    });
}
bot.catch(e => console.log(e))