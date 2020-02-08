import TableTile from "../support/elements/TableTile";
import CodapObject from "../support/elements/CodapObject";
import CaseCardObject from "../support/elements/CaseCardObject";
import CfmObject from "../support/elements/CfmObject";

const table = new TableTile;
const codap = new CodapObject;
const casecard = new CaseCardObject;
const cfm = new CfmObject;

const baseUrl = `${Cypress.config("baseUrl")}`;
const ext = '.codap';

before(()=> {
    var filename='TableC',
        dir='../fixtures/';

    cy.viewport(1400,1000);
    cy.visit(baseUrl)
    cy.wait(5000)

    cfm.openDocFromModal();
    cy.wait(500)
    cfm.openLocalDoc(dir+filename+ext)
    codap.getTableTileTitle().click() //bring the table into focus
}) 

context('table ui',()=>{ //tests for ui elements
    describe('table components', ()=>{//component title, minimize and close are tested in codap general tests
        it('verify table tool palette is visible on component focus',()=>{
            table.getTableToolPalette().should('be.visible');
            table.getRescaleTable().should('be.visible')
            table.getTrashIconMenu().should('be.visible')
            table.getOpenEyeIconMenu().should('be.visible')
            table.getRulerIconMenu().should('be.visible')
        })
        it('verify case card icon is visible when component is a table', ()=>{
            table.getCaseCardIcon().should('be.visible')
        })
    })
    describe('table view', ()=>{
        const collectionName = 'cases (179 cases)';
        it('verify collection name is visible', ()=>{
            table.getCollectionTitle().should('have.length', 1);
            table.getCollectionByName(collectionName).should('be.visible')
        })
        it('verify columns are visible',()=>{
            table.getColumnHeader().should('have.length',5)
        })  
        it('verify add attribute icon is visible for every collection on table focus', ()=>{
            table.getAddNewAttributePlusIcon(collectionName).should('be.visible')
        })
        it('verify collection creation dropzones are visible', ()=>{
            //TODO: need to think about this
        })

        it('verify description and formula is visible on hover', ()=>{
            //TODO: need to think about this
        })
        it('verify index menu is visible when index column is clicked', ()=>{ //openIndexMenu has an array of all the index menu not by collection
            table.openIndexMenu(25);
            table.getIndexMenu().should('be.visible');
            cy.clickMenuItem('Insert Case');     //dismisses index menu
            cy.wait(500);
            codap.undo(); //undo the insert case that dismissed the index menu
            cy.wait(500);
        })
    })
})

context('table tile component functionality', ()=>{ //tests for general table component functionality
    it('verify table switches to case card when case card icon is clicked', ()=>{
        table.changeToCaseCard();
        casecard.getCaseCardTile().should('be.visible');
    })
    it('verify case card switches to table when table icon is clicked', ()=>{
        table.changeToTable();
        table.getCaseTableTile().should('be.visible')
    })
    //TODO: can't get the close icon to be visible
    it.skip('verify table closes when close icon is clicked',()=>{
        codap.closeTile('table','Table C');
        codap.getTableTile().should('not.be.visible');
    })
    it.skip('verify table re-opens with correct data when table title is selected from table menu', ()=>{
        codap.openTile('table','Table C');
        codap.getTableTile().should('be.visible');
        table.getCaseCardIcon().should('be.visible');
        table.getAddNewAttributePlusIcon('Table C').should('be.visible');
        table.getCollection().should('be.visible').and('have.length', 1);
        table.getCollectionTitle().contains('Table C').should('be.visible')
        table.getIndex().should('have.length', 34)
    })
})

context('table view functionality', ()=>{ //tests for table view/slick grid elements
    describe('table header attribute menu', ()=>{
        let name = 'formAttr'
        it('verify add attribute',()=>{
            table.addNewAttribute('cases');
            table.getColumnHeader().should('have.length',6);
            table.getAttribute('CNUM1').should('exist');
            table.getAttribute('CNUM1').click();
            table.getAttribute('newAttr').should('exist');
        })
        it('verify edit attribute properties', ()=>{ //also verify that attribute description appears on hover
            let description = 'This should have a formula', type = null, unit=null, precision = null, editable = null;
            // table.editAttributeProperty('newAttr', name, description, type, unit, precision, editable)
            table.openAttributeMenu('newAttr');
            table.selectMenuItemFromAttributeMenu('Edit Attribute Properties...');
            table.enterAttributeName('{selectAll}{backspace}'+name);
            table.getApplyButton().click();
            table.getAttribute(name).should('exist');
            // TODO need to figure out the mouse event for the hover
            // table.getAttribute(name)
            //     .trigger('mouseover');
            // table.getAttribute(name).should('have.attr','title').and('contain',description)    
        })
        it('verify edit formula', ()=>{ //also verify that formula appears on hover, and column changes color
            let formula = ('CNUM1*CNUM2');
            table.editFormula(name, formula);
            cy.get('.dg-formula-column .dg-numeric').eq(0).should('contain',406);
        })
        it('verify hover over attribute shows description and formula',()=>{ //not sure what the text should be
            //current behavior is it only shows description

        })
        it('verify delete formula and keep value',()=>{//also verify that formula is not visible on hover

        })
        it('verify sort ascending', ()=>{

        })
        it('verify sort descending', ()=>{

        })
        it('create random() formula, and rerandomize', ()=>{

        })
        it('verify delete attribute',()=>{

        })
    })
    describe('reorder attribute',()=>{
        it('verify attribute reorder within a collection',()=>{

        })
        it('verify attribute create new leftmost collection',()=>{

        })
        it('verify create new collection between collections',()=>{

        })
        it('verify remove of middle collection',()=>{

        })
        it('verify remove of leftmost collection',()=>{

        })
    })
    describe('expand and collapse collection',()=>{ //need to create a three level table
        it('verify collapse child collection',()=>{

        })
        it('verify collapse middle collection',()=>{

        })
        it('verify expand middle collection',()=>{

        })
        it('verify expand child collection',()=>{

        })
        it('verify collapse middle collection',()=>{

        })
        it('verify reorder attributes while collection is collapsed',()=>{

        })
        it('verify create new collection while collecction is collapsed',()=>{

        })
        it('expand all collections',()=>{

        })
    })
    describe('index menu',()=>{
       it('verify index column cannot be reordered',()=>{

       }) 
       it('verify insert 1 case at the bottom',()=>{

       })
       it('verify insert multiple cases below current case at the bottom',()=>{

       })
       it('verify insert multiple cases above current case at the bottom', ()=>{

       })
       it('verify delete last case', ()=>{

       })
       it('verify insert 1 case at the top',()=>{

        })
        it('verify insert multiple cases below current case at the top',()=>{

        })
        it('verify insert multiple cases above current case at the top', ()=>{

        })
        it('verify delete first case', ()=>{

        })
        it('verify insert 1 case in the middle',()=>{

        })
        it('verify insert multiple cases below current case in the middle',()=>{
 
        })
        it('verify insert multiple cases above current case in the middle', ()=>{
 
        })
        it('verify delete case in the middle', ()=>{
 
        })
    })
})
context('table tool palette', ()=>{ //tests for tool palette elements
    //not sure how to test the column rescale function, and delete cases
    it('verify select all', ()=>{

    })
    it('verirfy select some', ()=>{

    })
    it('verify delete unselected', ()=>{

    })
    it('verify delete selected', ()=>{

    })
    it('verify delete all', ()=>{

    })
})
context('Multiple collections',function(){
    before(()=> {
        cy.viewport(1400,1000);
        cy.visit(baseUrl+'?url=https://codap.concord.org/~eireland/3TableGroups.json')
        cy.wait(5000)
        codap.getTableTileTitle().click() //bring the table into focus
    })
    describe('table UI', ()=>{
        it('verify collection name is visible', ()=>{
            table.getCollectionTitle().should('have.length', 3);
            table.getCollectionByName('Table A').should('be.visible')
            table.getCollectionByName('Table B').should('be.visible')
            table.getCollectionByName('Table C').should('be.visible')
        })
        it('verify add attribute icon is visible for every collection on table focus', ()=>{
            table.getAddNewAttributePlusIcon('Table A').should('be.visible')
            table.getAddNewAttributePlusIcon('Table B').should('be.visible')
            table.getAddNewAttributePlusIcon('Table C').should('be.visible')
        })
        it('verify expand/collapse icon is visible when there is more than one collection', ()=>{
            table.getCollapseIcon().should('have.attr', 'href').and('include', 'collapse.gif')
            table.getCollapseAllIcon().first().click({force:true});
            table.getExpandIcon().should('have.attr','href').and('include', 'expand.gif')
            // table.getExpandIcon().should('have.attr','href').and('include', 'no-action.png')//if parent is collapsed, child expanse/collapase should not be showing
            table.getExpandAllIcon().first().click({force:true});
            table.getCollapseIcon().should('have.attr', 'href').and('include', 'collapse.gif')
            table.getCollapseAllIcon().last().click({force:true});
            table.getCollapseIcon().should('have.attr', 'href').and('include', 'collapse.gif') //parent should still be collapsible
            // table.getExpandIcon().should('have.attr','href').and('include', 'expand.gif') //child should be collapsed
            table.getExpandAllIcon().last().click({force:true}); //expand child again
        }) 
    }) 
    
})
