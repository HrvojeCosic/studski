const Post = require('../models/Post');
const User = require('../models/User');

const respondError = res => {
	res.status(400).json({
		title: 'error',
		error: 'Validacija neuspješna. Ispravite sva polja i pokušajte ponovo.',
	});
	return;
};

module.exports.createNewPost = async (req, res) => {
	const { facultyName, postTitle, postAuthor, fileName } = req.body;

	//CHECK FOR EXISTING POST
	let postExists = false;
	await Post.findOne({
		where: {
			faculty: facultyName,
			title: postTitle,
			author: postAuthor,
			fileName: fileName,
		},
	})
		.then(result => {
			result.dataValues ? (postExists = true) : (postExists = false);
		})
		.catch(() => {
			console.log('post does not exist, continue...');
		});
	if (postExists) {
		return res
			.status(405)
			.json({ title: 'error', error: 'Taj materijal već postoji.' });
	}

	try {
		let authorID;
		await User.findOne({ where: { username: postAuthor } }).then(result => {
			authorID = result.dataValues.id;
		});

		try {
			await Post.create({
				user_id: authorID,
				author: postAuthor,
				faculty: facultyName,
				title: postTitle,
				points: 0,
				fileName,
			});
			const updatedUserPosts = await Post.findAll({
				where: { author: postAuthor },
			});
			res.status(200).json({
				title: 'success',
				message: 'Materijal uspješno objavljen.',
				updatedUserPosts,
			});
			return;
		} catch {
			respondError(res);
		}
	} catch {
		respondError(res);
	}
};
