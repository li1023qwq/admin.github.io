'use strict';
exports.main = async (event, context) => {
	const success = {
		success: true
	}
	const fail = {
		success: false
	}

	let body
	try {
		body = JSON.parse(event.body)
	} catch (e) {
		//TODO handle the exception
		return {
			code: 500,
			success: false,
			msg: '请求错误'
		}
	}

	const {
		alias
	} = body

	const db = uniCloud.database()
	let dbPublishList
	try {
		dbPublishList = db.collection('opendb-app-publish')
	} catch (e) {}

	if (!dbPublishList) return fail;

	const record = await dbPublishList.where({
		alias,
		status: 1
	}).get()

	if (record && record.data && record.data.length > 0) {
		return Object.assign({}, record.data[0], success)
	}

	return fail
};
