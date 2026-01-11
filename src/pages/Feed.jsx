import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
	addPostComment,
	addPostLike,
	loadPosts,
	loadPost,
} from '../store/actions/post.actions';
import { SvgIcon } from '../cmps/SvgIcon';
import { useState } from 'react';
import { Modal } from '../cmps/Modal';
import { postService } from '../services/post';
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service';
import { PostWithComments } from '../cmps/PostWithComments';
import { store } from '../store/store';
import { checkIsLiked } from '../services/util.service';

export function Feed() {
	const posts = useSelector((storeState) => storeState.postModule.posts);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalType, setModalType] = useState('menu'); // 'menu' or 'comments'

	const loggedInUser = userService.getLoggedinUser();

	useEffect(() => {
		loadPosts();
	}, []);

	console.log('posts:', posts);
	const navigate = useNavigate();

	// Function to open comments modal
	const handleOpenComments = async (postId) => {
		setModalType('comments');
		await loadPost(postId);
		setIsModalOpen(true);
	};

	// Function to open menu modal
	const handleOpenMenu = () => {
		setModalType('menu');
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setModalType('menu');
	};

	return (
		<section className="home">
			<section className="feed-grid-container">
				{posts &&
					posts.map((post) => {
						const isLiked = checkIsLiked(post, loggedInUser);

						return (
							<article key={post._id} className="post-article flex row">
								<div className="post-header">
									<img className="post-profile-img" src={post.by.imgUrl} />
									<h4 onClick={() => navigate(`/user/${post.by._id}`)}>
										{post.by.fullname}
									</h4>
									<SvgIcon
										iconName="postDots"
										className="icon"
										onClick={handleOpenMenu}
									/>
								</div>

								<img className="post-img" src={post.imgUrl} />

								<div className="post-desc">
									<h4 onClick={() => navigate(`/user/${post.by._id}`)}>
										{post.by.fullname}: <span>{post.txt}</span>
									</h4>

									<div className="post-actions">
										<SvgIcon
											iconName={isLiked ? 'likeFilled' : 'like'}
											fill={isLiked ? '#ff3040' : 'currentColor'}
											onClick={() => addPostLike(post._id)}
										/>
										<span>{post.likedBy.length}</span>

										<SvgIcon
											iconName="comment"
											onClick={() => handleOpenComments(post._id)}
										/>
										<span>{post.comments.length}</span>
									</div>
								</div>
							</article>
						);
					})}
			</section>
			<Modal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				variant={modalType}
			>
				{modalType === 'menu' && (
					<>
						<div className="modal-item danger">Report</div>
						<div className="modal-item">Not interested</div>
						<div className="modal-item">Go to post</div>
						<div className="modal-item">Share to...</div>
						<div className="modal-item">Copy link</div>
						<div className="modal-item">Embed</div>
						<div className="modal-item">About this account</div>
						<div className="modal-item cancel" onClick={handleCloseModal}>
							Cancel
						</div>
					</>
				)}
				{modalType === 'comments' && (
					<PostWithComments onClose={handleCloseModal} />
				)}
			</Modal>
		</section>
	);
}
