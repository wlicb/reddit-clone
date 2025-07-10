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
import { startEditComment, startEditPost } from '../actions';
import { createErrorSelector } from '../selectors';
import MentionAutocomplete from './MentionAutocomplete';

const EditBoxWithMentions = ({
  type = 'post',
  id,
  initialText,
  onClose,
  error,
  startEditPost,
  startEditComment,
  subredditName,
}) => {
  const [value, setValue] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef(null);
  const hasError = useRef(error);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      hasError.current = error;
    }
    return () => {
      isMounted = false;
    };
  });

  const handleChange = (e) => {
    const { value: newValue } = e.target;
    const cursorPos = e.target.selectionStart;
    
    setValue(newValue);
    setCursorPosition(cursorPos);

    // Hide mention box if last character is a space
    if (newValue[cursorPos - 1] === ' ') {
      setShowMentionAutocomplete(false);
      return;
    }

    // Check for @ mention
    checkForMention(newValue, cursorPos);
  };

  const checkForMention = (text, cursorPos) => {
    // Find the word being typed (from @ to cursor position)
    const beforeCursor = text.substring(0, cursorPos);
    const match = beforeCursor.match(/@(\w*)$/);
    
    if (match) {
      const mentionQuery = match[1];
      setShowMentionAutocomplete(true);
      setMentionQuery(mentionQuery);
      setMentionPosition(getMentionPosition());
    } else {
      setShowMentionAutocomplete(false);
    }
  };

  const getMentionPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0, placement: 'below' };
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
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
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionStart = beforeCursor.lastIndexOf('@');
    
    if (mentionStart !== -1) {
      // Replace the @mention with @username
      const newValue = 
        value.substring(0, mentionStart) + 
        `@${user.username} ` + 
        value.substring(cursorPosition);
      
      const newCursorPos = mentionStart + user.username.length + 2; // +2 for @ and space
      
      setValue(newValue);
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
    setIsLoading(true);
    if (type === 'post') {
      await startEditPost({ id, body: value });
    } else {
      await startEditComment({ id, body: value });
    }
    if (!hasError.current) {
      onClose();
    } else {
      setIsLoading(false);
    }
  };

  return (
    <Box position="relative">
      <form onSubmit={handleSubmit}>
        <FormControl mb={3} isInvalid={!!error}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && showMentionAutocomplete) {
                e.preventDefault();
                handleCloseMentionAutocomplete();
              }
            }}
            rows={5}
            placeholder="Edit your comment... (use @ to mention users)"
          />
          <FormErrorMessage>{error}</FormErrorMessage>
        </FormControl>
        <HStack>
          <Button
            isDisabled={value === initialText}
            isLoading={isLoading}
            type="submit"
          >
            save
          </Button>
          <Button onClick={onClose}>cancel</Button>
        </HStack>
      </form>

      {showMentionAutocomplete && (
        <MentionAutocomplete
          value={value}
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
};

const errorSelector = createErrorSelector(['EDIT_POST', 'EDIT_COMMENT']);

const mapStateToProps = (state) => ({
  error: errorSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  startEditPost: ({ id, body }) => dispatch(startEditPost({ id, body })),
  startEditComment: ({ id, body }) => dispatch(startEditComment({ id, body })),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditBoxWithMentions); 