import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Respuesta } from './respuesta';

describe('Respuesta', () => {
  let component: Respuesta;
  let fixture: ComponentFixture<Respuesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Respuesta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Respuesta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
