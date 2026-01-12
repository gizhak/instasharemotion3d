


export function ProfileImageComments({ comments }) {

    return (
        <div className="profile-image-comments">
            <h3>Comments</h3>
            <ul>
                {comments.map((comment) => (
                    <li key={comment.id}>
                        <img src={comment.by.imgUrl} alt={comment.by.fullname} />
                        <div>
                            <strong>{comment.by.fullname}</strong>
                            <span>{comment.txt}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );


}