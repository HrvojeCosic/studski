import Cookies from 'js-cookie';
import { Post, User } from '../reducers/user';

interface SetUserAction {
	type: string;
	payload: object;
}
interface GetUserAction {
	type: string;
	payload: {
		sid: string;
		currentUser: {
			username: string;
			points: number;
			posts: Array<Post>;
		};
	};
}

export const setUser = (
	username: string,
	points: number,
	posts: Array<Post>
): SetUserAction => {
	localStorage.setItem(
		'currentUser',
		JSON.stringify({ username, points, posts })
	);
	return {
		type: 'SET_USER',
		payload: { username, points, posts },
	};
};
export const removeUser = () => {
	Cookies.remove('connect.sid');
	localStorage.removeItem('currentUser');
	return {
		type: 'REMOVE_USER',
		payload: { user: '' },
	};
};
export const getUser = (): GetUserAction => {
	let sid = Cookies.get('connect.sid');
	!sid ? (sid = '') : (sid = sid);

	const currentUserStringified = localStorage.getItem('currentUser') || '{}';
	const currentUser: User = JSON.parse(currentUserStringified);

	return {
		type: 'GET_USER',
		payload: { sid, currentUser },
	};
};
export const updateUserPosts = (updateType: string, newPost?: Post) => {
	const currentUserStringified = localStorage.getItem('currentUser') || '{}';
	const currentUser: User = JSON.parse(currentUserStringified);

	if (updateType === 'add post' && newPost) {
		currentUser.posts.push(newPost);
	}

	localStorage.setItem('currentUser', JSON.stringify(currentUser));

	return {
		type: 'UPDATE_POSTS',
		payload: { currentUser },
	};
};
