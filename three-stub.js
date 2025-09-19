// THREE.js stub for Node.js context
module.exports = {
    Scene: class Scene {},
    WebGLRenderer: class WebGLRenderer {
        constructor() { this.domElement = {}; }
        render() {}
        setSize() {}
    },
    PerspectiveCamera: class PerspectiveCamera {},
    BoxGeometry: class BoxGeometry {},
    MeshBasicMaterial: class MeshBasicMaterial {},
    Mesh: class Mesh {}
};
