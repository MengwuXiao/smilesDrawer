/** A class representing an atom */
class Atom {
    /**
     * The constructor of the class Atom.
     *
     * @param {string} element The one-letter code of the element.
     * @param {string} [bondType='-'] The type of the bond associated with this atom.
     */
    constructor(element, bondType = '-') {
        this.element = element;
        this.explicit = false;
        this.ringbonds = new Array();
        this.rings = new Array();
        this.bondType = bondType;
        this.isTerminal = false;
        this.isBridge = false;
        this.isBridgeNode = false;
        this.bridgedRing = null;
        this.anchoredRings = new Array();
        this.bracket = null;
        this.chiral = 0;
    }

    /**
     * Defines this atom as the anchor for a ring. When doing repositionings of the vertices and the vertex associated with this atom is moved, the center of this ring is moved as well.
     *
     * @param {number} ringId A ring id.
     */
    addAnchoredRing(ringId) {
        if (!ArrayHelper.contains(this.anchoredRings, { value: ringId })) {
            this.anchoredRings.push(ringId);
        }
    }

    /**
     * Returns the number of ringbonds (breaks in rings to generate the MST of the smiles) within this atom is connected to.
     *
     * @returns {number} The number of ringbonds this atom is connected to.
     */
    getRingbondCount() {
        return this.ringbonds.length;
    }

    /**
     * Check whether or not this atom is rotatable. The atom is deemed rotatable if it is neither a member of a ring nor participating in a bond other than a single bond. TODO: Check the chemistry.
     *
     * @returns {boolean} A boolean indicating whether or not this atom is rotatable.
     */
    canRotate() {
        return this.bondType === '-' && this.rings.length == 0;
    }

    /**
     * Returns whether or not this atom participates in ringbonds (breaks in the ring in the MST).
     *
     * @returns {boolean} A boolean indicating whether or not this atom is associated with a ringbond.
     */
    hasRingbonds() {
        return this.ringbonds.length > 0;
    }

    /**
     * Returns the id of the ringbond with the highest id.
     *
     * @returns {number} The highest ringbond id associated with this atom.
     */
    getMaxRingbond() {
        let max = 0;
        for (let i = 0; i < this.ringbonds.length; i++) {
            if (this.ringbonds[i].id > max) {
                max = this.ringbonds[i].id
            }
        }
 
        return max;
    }

    /**
     * Checks whether or not this atom is a member of a given ring.
     *
     * @param {number} ringId A ring id.
     * @returns {boolean} A boolean indicating whether or not this atom is a member of a given ring.
     */
    hasRing(ringId) {
        for (let i = 0; i < this.rings; i++) {
            if (ringId === this.rings[i]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks whether or not two atoms share a common ringbond id. A ringbond is a break in a ring created when generating the spanning tree of a structure.
     *
     * @param {Atom} atomA An atom.
     * @param {Atom} atomB An atom.
     * @returns {boolean} A boolean indicating whether or not two atoms share a common ringbond.
     */
    haveCommonRingbond(atomA, atomB) {
        for (let i = 0; i < atomA.ringbonds.length; i++) {
            for (let j = 0; j < atomB.ringbonds.length; j++) {
                if (atomA.ringbonds[i].id == atomB.ringbonds[j].id) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get the highest numbered ringbond shared by two atoms. A ringbond is a break in a ring created when generating the spanning tree of a structure.
     *
     * @param {Atom} atomA An atom.
     * @param {Atom} atomB An atom.
     * @returns {number} The number of the maximum ringbond shared by two atoms.
     */
    maxCommonRingbond(atomA, atomB) {
        let commonMax = 0;
        let maxA = 0;
        let maxB = 0;

        for (let i = 0; i < atomA.ringbonds.length; i++) {
            if (atomA.ringbonds[i].id > maxA) {
                maxA = atomA.ringbonds[i].id;
            }

            for (let j = 0; j < atomB.ringbonds.length; j++) {
                if (atomB.ringbonds[j].id > maxB) {
                    maxB = atomB.ringbonds[j].id;
                } else if (maxA == maxB) {
                    commonMax = maxA;
                }
            }
        }

        return commonMax;
    }

    /**
     * Sorts an array of vertices by their respecitve atomic number.
     *
     * @param {Vertex} root The central vertex
     * @param {array} neighbours An array of vertex ids.
     * @param {array} vertices An array containing the vertices associated with the current molecule.
     * @param {array} rings An array containing the rings associated with the current molecule.
     * @returns {array} The array sorted by atomic number.
     */
    static sortByAtomicNumber(root, neighbours, vertices, rings) {
        let orderedVertices = new Array(vertices.length);
        let firstInRing = true;
        let allNeighboursInRing = true;

        for (let i = 0; i < neighbours.length; i++) {
            if (vertices[neighbours[i]].value.rings.length === 0) {
                allNeighboursInRing = false;
            }
        }

        for (let i = 0; i < neighbours.length; i++) {
            let vertex = vertices[neighbours[i]];
            let val = Atom.atomicNumbers[vertex.value.element];
             

            // Add a penality of 100 if the vertex is in a ring
            if (vertex.value.rings.length > 0) {
                let intersection = ArrayHelper.intersection(vertex.value.rings, root.value.rings);
                
                if (intersection.length === 3) {
                    val += 200;
                } else if (intersection.length === 2) {
                    val += 150;
                } else if (intersection.length === 1) {
                    if (neighbours.length < 4) {
                        if (firstInRing && !allNeighboursInRing) {
                            val = val - (100 + rings[intersection[0]].getSize());
                            firstInRing = false;
                        } else {
                            val = val + 100 + rings[intersection[0]].getSize();                
                        }
                    } else {
                        val = val - (100 + rings[intersection[0]].getSize());
                    }
                }
            }

            orderedVertices[i] = {
                atomicNumber: val,
                vertexId: vertex.id
            };
        }

        orderedVertices.sort(function (a, b) {
            // Sort highest to lowest
            return b.atomicNumber - a.atomicNumber;
        });

        return orderedVertices;
    }
}

Atom.atomicNumbers = {
    'H': 1,
    'He': 2,
    'Li': 3,
    'Be': 4,
    'B': 5,
    'b': 5,
    'C': 6,
    'c': 6,
    'N': 7,
    'n': 7,
    'O': 8,
    'o': 8,
    'F': 9,
    'Ne': 10,
    'Na': 11,
    'Mg': 12,
    'Al': 13,
    'Si': 14,
    'P': 15,
    'p': 15,
    'S': 16,
    's': 16,
    'Cl': 17,
    'Ar': 18,
    'K': 19,
    'Ca': 20,
    'Sc': 21,
    'Ti': 22,
    'V': 23,
    'Cr': 24,
    'Mn': 25,
    'Fe': 26,
    'Co': 27,
    'Ni': 28,
    'Cu': 29,
    'Zn': 30,
    'Ga': 31,
    'Ge': 32,
    'As': 33,
    'Se': 34,
    'Br': 35,
    'Kr': 36,
    'Rb': 37,
    'Sr': 38,
    'Y': 39,
    'Zr': 40,
    'Nb': 41,
    'Mo': 42,
    'Tc': 43,
    'Ru': 44,
    'Rh': 45,
    'Pd': 46,
    'Ag': 47,
    'Cd': 48,
    'In': 49,
    'Sn': 50,
    'Sb': 51,
    'Te': 52,
    'I': 53,
    'Xe': 54,
    'Cs': 55,
    'Ba': 56,
    'La': 57,
    'Ce': 58,
    'Pr': 59,
    'Nd': 60,
    'Pm': 61,
    'Sm': 62,
    'Eu': 63,
    'Gd': 64,
    'Tb': 65,
    'Dy': 66,
    'Ho': 67,
    'Er': 68,
    'Tm': 69,
    'Yb': 70,
    'Lu': 71,
    'Hf': 72,
    'Ta': 73,
    'W': 74,
    'Re': 75,
    'Os': 76,
    'Ir': 77,
    'Pt': 78,
    'Au': 79,
    'Hg': 80,
    'Tl': 81,
    'Pb': 82,
    'Bi': 83,
    'Po': 84,
    'At': 85,
    'Rn': 86,
    'Fr': 87,
    'Ra': 88,
    'Ac': 89,
    'Th': 90,
    'Pa': 91,
    'U': 92,
    'Np': 93,
    'Pu': 94,
    'Am': 95,
    'Cm': 96,
    'Bk': 97,
    'Cf': 98,
    'Es': 99,
    'Fm': 100,
    'Md': 101,
    'No': 102,
    'Lr': 103,
    'Rf': 104,
    'Db': 105,
    'Sg': 106,
    'Bh': 107,
    'Hs': 108,
    'Mt': 109,
    'Ds': 110,
    'Rg': 111,
    'Cn': 112,
    'Uut': 113,
    'Uuq': 114,
    'Uup': 115,
    'Uuh': 116,
    'Uus': 117,
    'Uuo': 118
}


