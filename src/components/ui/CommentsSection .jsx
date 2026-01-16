import { useState } from "react";
import {
    ChevronRight, Dot
} from "lucide-react";

const CommentsSection = ({ comments = [] }) => {
    const [showAll, setShowAll] = useState(false);

    if (!comments.length) {
        return <p className="text-gray-400 text-center py-4">No comments yet.</p>;
    }

    const firstComment = comments[0];
    const lastComment = comments[comments.length - 1];
    const middleComments = comments.slice(1, -1);

    return (
        <div
            className="h-[69.5vh] p-4 flex flex-col overflow-y-auto"
            style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#ccc #f9f9f9",
            }}
        >
            <CommentItem key={firstComment._id} comment={firstComment} />
            {middleComments.length > 0 && (
                <div
                    className="flex items-center text-[#b5b5b5] mt-2 mb-2 self-start cursor-pointer transition-colors"
                    onClick={() => setShowAll((prev) => !prev)}
                >
                    <ChevronRight size={18}
                        className={`transition-transform duration-300 ${showAll ? "rotate-90" : "rotate-0"
                            }`}
                    />
                    <span className="ml-2">{showAll ? "Hide" : `Show ${middleComments.length} More`}</span>
                </div>
            )}

            {showAll &&
                middleComments.map((comment) => (
                    <CommentItem key={comment._id} comment={comment} />
                ))}

            {comments.length > 1 && <CommentItem key={lastComment._id} comment={lastComment} />}
        </div>
    );
};

const CommentItem = ({ comment }) => (
    <div className="flex justify-between gap-[20px] mb-[10px]  hover:bg-white rounded">
        <div className="text-gray-500 w-[60%]">
            <span className="flex gap-[5px]">
                <span><Dot size={20} /></span>
                <span>{comment.text}</span>
            </span>
        </div>
        <div className="text-gray-500 w-[40%] text-right text-[11px]">
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
    </div>
);

export default CommentsSection;