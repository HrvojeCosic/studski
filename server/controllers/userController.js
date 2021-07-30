const express = require('express');
const cookieParser = require('cookie-parser');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Post = require('../models/Post');

const app = express();
app.use(cookieParser());

module.exports.createNewUser = async (req, res) => {
	const { username, password, repeatPassword, email } = req.body;
	if (!username || !password || !repeatPassword || !email) {
		res
			.status(403)
			.json({ title: 'error', error: 'Sva polja moraju biti ispunjena.' });
		return;
	}
	if (password != repeatPassword) {
		res
			.status(403)
			.json({ title: 'error', error: 'Zaporke se ne podudaraju.' });
		return;
	}
	if (password.length < 5) {
		res
			.status(403)
			.json({ title: 'error', error: 'Zaporka mora imati najmanje 5 slova.' });
		return;
	}
	//CHECK FOR EXISTING MAIL
	const emailUniqueCheck = User.findAll({ where: { email: email } });
	let emailAlreadyExists;
	await emailUniqueCheck.then(result => {
		result.length != 0
			? (emailAlreadyExists = true)
			: (emailAlreadyExists = false);
	});
	//CHECK FOR EXISTING USERNAME
	const usernameUniqueCheck = User.findAll({ where: { username: username } });
	let usernameAlreadyExists;
	await usernameUniqueCheck.then(result => {
		result.length != 0
			? (usernameAlreadyExists = true)
			: (usernameAlreadyExists = false);
	});

	if (emailAlreadyExists) {
		res.status(403).json({ title: 'error', error: 'Taj je e-mail zauzet.' });
		return;
	}
	if (usernameAlreadyExists) {
		res
			.status(403)
			.json({ title: 'error', error: 'To je korisničko ime zauzeto.' });
		return;
	}
	//IF EVERYTHING PASSES, CREATE USER
	User.create({
		username: username,
		password: bcrypt.hashSync(password, 10),
		email: email,
	})
		.then(() => {
			res
				.status(200)
				.json({ title: 'success', message: 'Korisnik uspješno kreiran' });
		})
		.catch(() => {
			res.status(400).json({
				title: 'error',
				error: 'Validacija neuspješna. Ispravite sva polja i pokušajte ponovo.',
			});
			return;
		});
};

module.exports.logUserIn = async (req, res) => {
	const { username, password } = req.body;
	try {
		if (!username || !password) {
			res
				.status(403)
				.json({ title: 'error', error: 'Sva polja moraju biti ispunjena.' });
			return;
		}
		const userInfo = await User.findOne({ where: { username: username } });
		const userPosts = await Post.findAll({
			where: { user_id: userInfo.dataValues.id },
		});
		if (!userInfo) {
			res
				.status(403)
				.json({ title: 'error', error: 'Taj korisnik ne postoji.' });
			return;
		}
		let correctPassword = false;
		correctPassword = await bcrypt.compare(password, userInfo.password);
		if (!correctPassword) {
			res.status(403).json({ title: 'error', error: 'Netočna lozinka.' });
			return;
		}

		req.session.username = userInfo.dataValues.username; //triggering cookie placement
		res.status(200).json({
			title: 'success',
			message: 'Prijava uspješna',
			userInfo: userInfo,
			userPosts,
		});
	} catch {
		res
			.status(404)
			.json({ title: 'error', error: 'Pokušajte ponovno kasnije.' });
		return;
	}
};
