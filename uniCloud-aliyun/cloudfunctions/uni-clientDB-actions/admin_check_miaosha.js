// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		//批量查询秒杀信息
		const miaosha_ids = result.data.map(e => e.miaosha_id);
		const {
			data
		} = await db.collection("tian-mall-hour-miaosha").where({
			_id: cmd.in(miaosha_ids)
		}).get()
		const miaoshaMap = data.reduce((pre, item) => {
			pre[item._id] = item;
			return pre;
		}, {})

		result.data.forEach(item => {
			item.miaosha = miaoshaMap[item.miaosha_id]
		})
		return result
	}
}
