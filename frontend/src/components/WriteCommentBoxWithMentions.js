import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Box,
  HStack,
  FormControl,
  FormErrorMessage,
  Textarea,
  Button,
} from '@chakra-ui/react';
import { userSelector, createLoadingAndErrorSelector } from '../selectors';
import { submitComment } from '../actions/comments';
import MentionAutocomplete from './MentionAutocomplete';

const WriteCommentBoxWithMentions = (props) => {
  const [body, setBody] = useState('');
  const [hasError, setHasError] = useState(false);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const { value } = e.target;
    const cursorPos = e.target.selectionStart;
    
    setBody(value);
    setCursorPosition(cursorPos);

    // Hide mention box if last character is a space
    if (value[cursorPos - 1] === ' ') {
      setShowMentionAutocomplete(false);
      return;
    }

    // Check for @ mention
    checkForMention(value, cursorPos);
  };

  const checkForMention = (text, cursorPos) => {
    // Find the word being typed (from @ to cursor position)
    const beforeCursor = text.substring(0, cursorPos);
    const match = beforeCursor.match(/@(\w*)$/);
    
    console.log('Checking for mention:', { text, cursorPos, beforeCursor, match });
    
    if (match) {
      const mentionQuery = match[1];
      console.log('Found @ mention, showing autocomplete');
      setShowMentionAutocomplete(true);
      setMentionQuery(mentionQuery);
      setMentionPosition(getMentionPosition());
    } else {
      console.log('No @ mention found, hiding autocomplete');
      setShowMentionAutocomplete(false);
    }
  };

  // Temporary test - always show popup for debugging
  useEffect(() => {
    if (body.includes('@')) {
      console.log('Body contains @, showing autocomplete for testing');
      setShowMentionAutocomplete(true);
      setMentionPosition(getMentionPosition());
    }
  }, [body]);

  const getMentionPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0, placement: 'below' };
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const parentRect = textarea.parentElement.getBoundingClientRect();
    const popupHeight = 220; // px
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let placement = 'below';
    let top = rect.height + 4; // default: below
    if (spaceBelow < popupHeight && spaceAbove > popupHeight) {
      placement = 'above';
      top = -popupHeight - 4;
    }
    return {
      top,
      left: 0,
      placement
    };
  };

  const handleMentionSelect = (user) => {
    // Find the start of the @ mention
    const beforeCursor = body.substring(0, cursorPosition);
    const mentionStart = beforeCursor.lastIndexOf('@');
    
    if (mentionStart !== -1) {
      // Replace the @mention with @username
      const newBody = 
        body.substring(0, mentionStart) + 
        `@${user.username} ` + 
        body.substring(cursorPosition);
      
      const newCursorPos = mentionStart + user.username.length + 2; // +2 for @ and space
      
      setBody(newBody);
      setCursorPosition(newCursorPos);
      setShowMentionAutocomplete(false);
      
      // Set cursor position in textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleCloseMentionAutocomplete = () => {
    setShowMentionAutocomplete(false);
  };

  // Hide mention box on blur (with small delay to allow click selection)
  const handleBlur = () => {
    setTimeout(() => setShowMentionAutocomplete(false), 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { postId, parentCommentId, submitComment, onClose } = props;
    
    try {
      await submitComment({
        body,
        post_id: postId,
        parent_comment_id: parentCommentId,
      });
      
      setBody('');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      setHasError(true);
    }
  };

  const { type = 'comment', isLoading, error, user, onClose, subredditName } = props;
  const isReply = type === 'reply';

  return (
    <Box position="relative">
      <form onSubmit={handleSubmit}>
        <FormControl mb={3} isInvalid={error && hasError}>
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && showMentionAutocomplete) {
                e.preventDefault();
                handleCloseMentionAutocomplete();
              }
            }}
            variant="filled"
            isDisabled={!user}
            placeholder="what are your thoughts? (use @ to mention users)"
            rows={5}
          />
          <FormErrorMessage>{error}</FormErrorMessage>
        </FormControl>
        <HStack>
          <Button isDisabled={!body} isLoading={isLoading} type="submit">
            {type}
          </Button>
          {isReply && onClose && <Button onClick={onClose}>cancel</Button>}
        </HStack>
      </form>

      {showMentionAutocomplete && (
        <MentionAutocomplete
          value={body}
          onChange={handleChange}
          onMentionSelect={handleMentionSelect}
          subredditName={subredditName}
          isVisible={showMentionAutocomplete}
          position={mentionPosition}
          placement={mentionPosition?.placement}
          onClose={handleCloseMentionAutocomplete}
          mentionQuery={mentionQuery}
        />
      )}
    </Box>
  );
}

const { loadingSelector, errorSelector } = createLoadingAndErrorSelector(
  ['SUBMIT_COMMENT'],
  false
);

const mapStateToProps = (state) => ({
  isLoading: loadingSelector(state),
  error: errorSelector(state),
  user: userSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  submitComment: (commentDetails) => dispatch(submitComment(commentDetails)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WriteCommentBoxWithMentions); 