// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
const articleCollection = db.collection("opendb-news-articles");
const articleReadCollection = db.collection("opendb-news-article-read");
/**
 * 检查用户是否已读此文章
 */
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		const {
			uid
		} = state.auth;
		let ids = result.data.map(e => e._id);
		if (uid && ids.length > 0) {
			let dayTime = getTodayTime(0,1);
			let {
				data
			} = await articleReadCollection.where({
				article_id: cmd.in(ids),
				user_id: uid,
				create_date: cmd.gt(dayTime)
			}).field({
				article_id: 1,
				create_date: 1
			}).get();
			if (data.length > 0) {
				//转换为键值对
				let dataMap = {};
				data.map(item => {
					dataMap[item.article_id] = item.create_date;
				})

				result.data.forEach(item => {
					item.read = dataMap[item._id] ? dataMap[item._id] : 0;
				})
			}
		}
		return result
	}
}

let timeZone = 8;

function getTodayTime(day = 0, check = false) {
	let time = new Date();
	time.setMinutes(0);
	time.setSeconds(0);
	time.setMilliseconds(0);
	if (check) {
		//由于时差问题，我们的0点，是utc的前一天16点
		time.setHours(time.getHours() + timeZone);
		time.setHours(timeZone * -1);
	}else{
		time.setHours(0);
	}
	if (day != 0) {
		time.setDate(time.getDate() + day);
	}
	return time.getTime();
}
