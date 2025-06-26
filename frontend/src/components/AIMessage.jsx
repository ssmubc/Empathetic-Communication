import React from "react";
import PropTypes from "prop-types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Avatar } from "@mui/material";
import ReactMarkdown from "react-markdown";

// Custom renderer for markdown response
const MarkdownRender = ({ content }) => {
  return (
    <ReactMarkdown
      children={content}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={dracula}
              language={match[1]}
              PreTag="div"
              customStyle={{ fontSize: "0.85em" }}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    />
  );
};

const AIMessage = ({ message, profilePicture, name = "AI" }) => {
  return (
    <div className="ml-16 mb-6 mr-16">
      <div className="flex flex-row flex-start">
        <Avatar
          src={profilePicture || ""}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: "#e0e0e0",
            color: "#757575",
            fontSize: "0.8rem",
          }}
        >
          {!profilePicture && name.charAt(0).toUpperCase()} 
        </Avatar>
        <div
          className="text-start ml-4 text-black"
          style={{
            maxWidth: "61vw",
            width: "61vw",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          <MarkdownRender content={message} />
        </div>
      </div>
    </div>
  );
};

AIMessage.propTypes = {
  message: PropTypes.string.isRequired,
  profilePicture: PropTypes.string,
  name: PropTypes.string, 
};

export default AIMessage;