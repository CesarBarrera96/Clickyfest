import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketplaceComponent } from './marketplace'; // <-- CORREGIDO

describe('MarketplaceComponent', () => { // <-- CORREGIDO
  let component: MarketplaceComponent; // <-- CORREGIDO
  let fixture: ComponentFixture<MarketplaceComponent>; // <-- CORREGIDO

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MarketplaceComponent ] // <-- CORREGIDO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MarketplaceComponent); // <-- CORREGIDO
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
