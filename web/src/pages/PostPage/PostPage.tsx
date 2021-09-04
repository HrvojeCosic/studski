import axios from 'axios';
import Cookies from 'js-cookie';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { updateUserPosts } from '../../actions/user';
import './PostPage.scss';

interface PostParams {
	postID: string;
}

interface PostFile {
	createdAt: string;
	fileName: string;
	id: number;
	post_id: number;
	updatedAt: string;
}

export const PostPage: React.FC = () => {
	const [post, setPost] = useState<any>({}); //"any" BECAUSE OF createdAt PROPERTY IN Post TYPE‚
	const [voted, setVoted] = useState<boolean>(false);
	const [files, setFiles] = useState<Array<PostFile>>([]);
	const [allowVote, setAllowVote] = useState<boolean>(true);
	const [deletePrompt, setDeletePrompt] = useState<boolean>(false);
	const [visitor, setVisitor] = useState<string>('');
	const params: PostParams = useParams();

	const dispatch = useDispatch();
	const history = useHistory();

	useEffect(() => {
		const sid = Cookies.get('connect.sid');
		axios
			.post('http://localhost:8000/api/users/checkAuth', sid, {
				withCredentials: true,
			})
			.then(res => {
				setVisitor(res.data.message);
			});

		axios
			.get(`http://localhost:8000/api/posts/getPost/${params.postID}`)
			.then(res => {
				setPost(res.data.post);
				setFiles(res.data.files);
			})
			.catch(err => {
				alert(err.response.data.error); //TODO: create an error page OR redirect back
			});

		const user = localStorage.getItem('currentUser');
		let username;
		if (!user) setAllowVote(false);
		else if (user) username = JSON.parse(user).username;

		axios
			.get(
				`http://localhost:8000/api/posts/checkVoted/${username}/${params.postID}`
			)
			.then(res => {
				if (res.data.message === 'already voted') setVoted(true);
				else if (res.data.message === 'has not voted') setVoted(false);
			});
	}, [params.postID]);

	const voteForPost = () => {
		const postID = params.postID;
		const postAuthor = post.author;

		const user = localStorage.getItem('currentUser');
		let voter = '';
		if (user) voter = JSON.parse(user).username;

		axios
			.patch('http://localhost:8000/api/posts/voteForPost', {
				postID,
				postAuthor,
				voter,
			})
			.then(res => {
				if (res.data.message === 'upvoted') {
					post.points++;
					setVoted(true);
					dispatch(updateUserPosts('upvote post', undefined, post));
				} else if (res.data.message === 'downvoted') {
					post.points--;
					setVoted(false);
					dispatch(updateUserPosts('downvote post', undefined, post));
				}
			});
	};

	const downloadFile = (fileName: string) => {
		window.open(`http://localhost:8000/api/posts/downloadFile/${fileName}`);
	};

	const deletePost = () => {
		axios
			.delete(`http://localhost:8000/api/posts/deletePost/${params.postID}`)
			.then(res => {
				dispatch(
					updateUserPosts('delete post', undefined, undefined, res.data.post)
				);
				history.push('/');
			});
	};

	const filesJSX = files.map(file => {
		const readableFileName = file.fileName.slice(0, -13); //Date.now() ADDS EXACTLY 13 CHARACTERS

		return (
			<div key={file.id}>
				<div
					onClick={() => {
						downloadFile(file.fileName);
					}}
				>
					{readableFileName}
				</div>
			</div>
		);
	});

	return (
		<div>
			<p>{post.author}</p>
			<p>{post.faculty}</p>
			<p>{post.title}</p>
			<p>{post.createdAt}</p>
			{allowVote && post.author !== visitor ? (
				<div onClick={voteForPost}>
					<p className={voted ? 'voted' : 'non-voted'}>KORISNO</p>
				</div>
			) : (
				''
			)}
			<p>broj bodova: {post.points}</p>
			{filesJSX}

			{visitor === post.author ? (
				<div
					onClick={() => {
						setDeletePrompt(true);
					}}
				>
					Obriši objavu
				</div>
			) : (
				''
			)}

			{deletePrompt ? (
				<div>
					<h3>Jeste li sigurni da želite obrisati ovu objavu?</h3>
					<div onClick={deletePost}>DA</div>
					<div
						onClick={() => {
							setDeletePrompt(false);
						}}
					>
						NE
					</div>
				</div>
			) : (
				''
			)}
		</div>
	);
};
