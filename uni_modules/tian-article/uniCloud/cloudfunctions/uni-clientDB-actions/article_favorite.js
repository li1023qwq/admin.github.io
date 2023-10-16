// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
const articleCollection = db.collection("opendb-news-articles");
const favoriteCollection = db.collection("opendb-news-favorite");
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			console.log("error", error)
			throw error
		}
		const {
			uid
		} = state.auth;
		if (!uid) {
			console.log("未登录", uid)
			result.data = "未登录"
			return result;
		}
		console.log("uid", uid)
		/* //增加阅读量
		await articleCollection.doc(result.data._id).update({
			like_count: cmd.inc(1)
		}); */
		let where = state.command.getParam({
			name: 'where',
			index: 0
		});
		let article_id = where[0].article_id;
		//判断是否已经收藏
		console.log("article_id", article_id)
		const {
			data
		} = await favoriteCollection.where({
			article_id,
			user_id: uid
		}).get();
		if (data.length == 0) {
			//新增收藏
			return await favoriteCollection.add({
				article_id,
				user_id: uid,
				create_date: Date.now()
			})
		}

		return result
	}
}
