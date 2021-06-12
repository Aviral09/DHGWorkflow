import CoreGraph from './core-graph-builder';
import { actionType as T } from '../reducer';
import getBoundaryPoint from './calc-boundary-point';

const TailoredGraph = (ParentClass) => class TG extends CoreGraph(ParentClass) {
    static calJuncNodePos(juncNode) {
        const parNode = juncNode.incomers('node')[0];
        const meanNbrPosition = { x: 0, y: 0 };
        const setOfPos = new Set();
        juncNode.outgoers('node').forEach((node) => setOfPos.add(JSON.stringify(node.position())));
        setOfPos.forEach((posStr) => {
            const pos = JSON.parse(posStr);
            meanNbrPosition.x += pos.x;
            meanNbrPosition.y += pos.y;
        });
        if (setOfPos.size === 0) return meanNbrPosition;
        meanNbrPosition.x /= setOfPos.size;
        meanNbrPosition.y /= setOfPos.size;
        return getBoundaryPoint(
            parNode.position(), meanNbrPosition,
            parseInt(parNode.style().width.slice(0, -2), 10) / 2,
            parseInt(parNode.style().height.slice(0, -2), 10) / 2,
            parNode.style().shape,
        );
    }

    getRealNode(juncNodeId) {
        return this.getById(juncNodeId).incomers().filter('node')[0];
    }

    addAutoMove(juncNode) {
        juncNode.unselectify();
        return this;
    }

    setNodeEvent(node) {
        node.on('drag style moved', () => {
            node.connectedEdges().connectedNodes('node[type="special"]').forEach((juncNode) => {
                juncNode.position(TG.calJuncNodePos(juncNode));
            });
        });
        return this;
    }

    addEdgeWithJuncNode(sourceID, targetID, tid) {
        const juncNode = this.getById(sourceID);
        const ed = super.addEdge(
            sourceID, targetID,
            juncNode.data('edgeLabel'),
            juncNode.data('edgeStyle'),
            'ordin',
            undefined, tid,
        );
        juncNode.position(TG.calJuncNodePos(juncNode));
        return ed;
    }

    addEdgeWithoutJuncNode(sourceID, targetID, label, style, tid) {
        const sourceNode = this.getById(sourceID);
        const targetNode = this.getById(targetID);
        const sourceNodeStyle = sourceNode.style();
        const juncNodePos = getBoundaryPoint(
            sourceNode.position(),
            targetNode.position(),
            parseInt(sourceNodeStyle.width.slice(0, -2), 10) / 2,
            parseInt(sourceNodeStyle.height.slice(0, -2), 10) / 2,
            sourceNodeStyle.shape,
        );
        const juncNode = super.addNode('', { 'background-color': style['line-color'] },
            'special', juncNodePos, { edgeLabel: label, edgeStyle: style }, undefined, tid);
        super.addEdge(sourceID, juncNode.id(), '', {
            ...style,
            'target-arrow-shape': 'none',
        }, 'special', undefined, tid);
        this.addAutoMove(juncNode, sourceNode);
        return this.addEdgeWithJuncNode(juncNode.id(), targetID, tid);
    }

    addEdge(sourceID, targetID, label = '', style, tid = this.getTid()) {
        const sourceNode = this.getById(sourceID);
        if (sourceNode.data('type') === 'special') return this.addEdgeWithJuncNode(sourceID, targetID, tid);
        const juncNodes = sourceNode.outgoers('node').filter((node) => node.data('edgeLabel') === label);
        if (juncNodes.length) return this.addEdgeWithJuncNode(juncNodes[0].id(), targetID, tid);
        if (label.length) return this.addEdgeWithoutJuncNode(sourceID, targetID, label, style, tid);
        this.dispatcher({
            type: T.Model_Open_Create_Edge,
            cb: (edgeLabel, edgeStyle) => this.addEdgeWithoutJuncNode(sourceID, targetID, edgeLabel, edgeStyle, tid),
        });
        return this;
    }

    updateEdge(id, style, label, shouldUpdateLabel, tid = this.getTid()) {
        const junctionNode = this.getById(id).source();
        if (shouldUpdateLabel) this.updateData(junctionNode.data('id'), 'edgeLabel', label, tid);
        this.updateData(junctionNode.data('id'), 'edgeStyle', style, tid);
        this.updateNode([junctionNode.data('id')], { 'background-color': style['line-color'] }, '', false, tid);

        junctionNode
            .outgoers('edge')
            .forEach((edge) => super.updateEdge(edge.data('id'), style, label, shouldUpdateLabel, tid));
    }

    deleteElem(id, tid = this.getTid()) {
        const el = this.getById(id);
        if (el.isNode()) {
            if (el.removed()) return;
            el.outgoers('node').forEach((x) => super.deleteElem(x.id(), tid));
            el.connectedEdges().forEach((x) => this.deleteElem(x.id(), tid));
            super.deleteNode(id, tid);
        } else {
            if (el.removed()) return;
            const junctionNode = el.source();
            super.deleteEdge(id, tid);
            if (junctionNode) if (junctionNode.outgoers().length === 0) this.deleteNode(junctionNode.id(), tid);
        }
    }

    getRealSourceId(nodeID) {
        if (this.getById(nodeID).data('type') === 'ordin') return nodeID;
        if (this.getById(nodeID).incomers('node').length === 0) return nodeID;
        return this.getById(nodeID).incomers('node')[0].id();
    }
};

export default TailoredGraph;