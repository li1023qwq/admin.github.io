// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
/**
 * 备份数据
 */
module.exports = {
	before: async (state, event) => {
		let where = state.command.getParam({
			name: 'where',
			index: 0
		});
		console.log("where", where)
		// 操作类型，可能的值'read'、'create'、'update'、'delete'
		let type = state.type;
		//从源数据删除
		if (type == "delete") {
			let collection = db.collection(state.collection);
			let backupCollection = db.collection(state.collection + "-backup");
			let res = await collection.where(where[0]).get();
			if (res.data.length > 0) {
				await backupCollection.add(res.data[0]);
			}
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		return result
	}
}
