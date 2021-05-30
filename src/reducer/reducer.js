import T from './actionType';
import NodeDetails from '../component/NodeDetails';
import EdgeDetails from '../component/EdgeDetails';
import { NodeStyle, EdgeStyle } from '../config/defaultStyles';

const reducer = (state, action) => {
    switch (action.type) {
    case T.Model_Open_Create_Node:
        return {
            ...state,
            ModelOpen: true,
            modalPayload: {
                title: 'Create Node',
                submitText: 'Create Node',
                Children: NodeDetails,
                defaultStyle: NodeStyle,
                cb: action.cb,
            },
        };
    case T.Model_Open_Create_Edge:
        return {
            ...state,
            ModelOpen: true,
            modalPayload: {
                title: 'Create Edge',
                submitText: 'Create Edge',
                Children: EdgeDetails,
                defaultStyle: EdgeStyle,
                cb: action.cb,
            },
        };
    case T.Model_Close:
        return { ...state, ModelOpen: false };
    default:
        return state;
    }
};
export default reducer;