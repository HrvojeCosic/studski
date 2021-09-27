import axios from 'axios';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { updateUserPosts } from '../../actions/user';
import { NavBar } from '../../components/NavBar/NavBar';
import { store } from '../..';
import { Dropdown } from '../../components/Dropdown/Dropdown';
import { useSelector } from 'react-redux';
import { toggleBurger } from '../../actions/render';
import { User } from '../../reducers/user';
import useAuth from '../../hooks/useAuth';
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
	const [loading, setLoading] = useState<boolean>(false);
	const params: PostParams = useParams();

	const dispatch = useDispatch();
	const history = useHistory();
	const { burger } = store.getState().renderState;
	useSelector(state => state);

	useAuth();

	useEffect(() => {
		const { username } = store.getState().userState;
		if (username) {
			axios.get(`/posts/checkVoted/${username}/${params.postID}`).then(res => {
				if (res.data.message === 'already voted') setVoted(true);
				else if (res.data.message === 'has not voted') setVoted(false);
			});
		}
	}, [params.postID]);

	useEffect(() => {
		if (burger) dispatch(toggleBurger());

		setLoading(true);
		const cancelTokenSource = axios.CancelToken.source();

		axios
			.get(`/posts/getPost/${params.postID}`)
			.then(res => {
				setPost(res.data.post);
				setFiles(res.data.files);
				setLoading(false);
			})
			.catch(err => {
				alert(err.response.data.error);
				setLoading(false);
				history.push('/');
			});

		return () => {
			cancelTokenSource.cancel('component unmounted, requests cancelled');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [history, dispatch]);

	const voteForPost = () => {
		const postID = params.postID;
		const postAuthor = post.author;

		const voter = user.username;

		axios
			.patch('/posts/voteForPost', {
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
		const domain =
			process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_PROD_URL
				: process.env.REACT_APP_DEV_URL;
		window.open(`${domain}/posts/downloadFile/${fileName}`);
	};

	const deletePost = () => {
		axios.delete(`/posts/deletePost/${params.postID}`).then(res => {
			dispatch(
				updateUserPosts('delete post', undefined, undefined, res.data.post)
			);
			history.push('/');
		});
	};

	const filesJSX = files.map(file => {
		const readableFileName = file.fileName.slice(0, -13); //Date.now() ADDS EXACTLY 13 CHARACTERS
		let image;
		const setImage = (src: string) => {
			image = <img src={src} className='image' alt={'extension icon'} />;
		};
		switch (readableFileName.slice(-3)) {
			case 'pdf':
				setImage('../../icons/extensionIcons/pdf.png');
				break;
			case 'doc':
			case 'docx':
			case 'docm':
			case 'rtf':
			case 'dot':
			case 'dotx':
			case 'dotm':
			case 'odt':
				setImage('../../icons/extensionIcons/doc.png');
				break;
			case 'mht':
			case 'mhtml':
			case 'htm':
			case 'html':
				setImage('../../icons/extensionIcons/html.png');
				break;
			case 'css':
				setImage('../../icons/extensionIcons/css.png');
				break;
			case 'jpg':
			case 'jpeg':
				setImage('../../icons/extensionIcons/jpg.png');
				break;
			case 'mp3':
				setImage('../../icons/extensionIcons/mp3.png');
				break;
			case 'ppt':
				setImage('../../icons/extensionIcons/ppt.png');
				break;
			case 'xls':
				setImage('../../icons/extensionIcons/xls.png');
				break;
			case 'zip':
				setImage('../../icons/extensionIcons/zip.png');
				break;
			case 'txt':
				setImage('../../icons/extensionIcons/txt.png');
				break;
			default:
				setImage('../../icons/extensionIcons/other.png');
		}

		return (
			<div key={file.id}>
				<div
					onClick={() => {
						downloadFile(file.fileName);
					}}
				>
					<div className='downloadable'>
						{image}
						<div className='file-name'>{readableFileName}</div>
					</div>
				</div>
			</div>
		);
	});

	const user: User = store.getState().userState;
	if (!user.username && user.loaded) setAllowVote(false);
	return (
		<div className='main-postpage-container'>
			<NavBar />
			<Dropdown show={burger ? true : false} />
			<div
				className={loading ? 'post loading' : 'post'}
				style={burger ? { display: 'none' } : {}}
			>
				<div className='upper-info'>
					<p className='post-title'>{post.title}</p>
					{user.username === post.author && (
						<img
							src='../../icons/otherIcons/delete-item.png'
							alt=''
							onClick={() => {
								setDeletePrompt(true);
							}}
						/>
					)}
				</div>
				{deletePrompt && (
					<div>
						<h3 style={{ fontWeight: 300 }}>
							Jeste li sigurni da želite obrisati ovu objavu?
						</h3>
						<div onClick={deletePost} className='delete-post-yes'>
							DA
						</div>
						<div
							className='delete-post-no'
							onClick={() => {
								setDeletePrompt(false);
							}}
						>
							NE
						</div>
					</div>
				)}
				<div className='middle-upper-info'>
					<Link to={`/korisnik/${post.author}`} className='post-faculty'>
						{post.author}
					</Link>
					<Link to={`/fakultet/${post.faculty}`} className='post-faculty'>
						{post.faculty}
					</Link>
				</div>
				{!loading && (
					<div>
						<p className='post-date'>Objavljeno {post.createdAt}</p>
						<p>Kolegijalnost: {post.points}</p>
						{allowVote && post.author !== user.username && (
							<div onClick={voteForPost}>
								<p className={voted ? 'voted' : 'non-voted'}>KORISNO?</p>
							</div>
						)}
					</div>
				)}
				{filesJSX}
			</div>
		</div>
	);
};
